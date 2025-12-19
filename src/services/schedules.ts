import { supabase } from '@/lib/supabase/client'
import { Schedule, Professional } from '@/types'
import { format } from 'date-fns'

/**
 * Fetches available schedules for a specific service and date,
 * respecting professional availability, overrides, and existing appointments.
 *
 * Uses the `get_available_slots_for_service` RPC which handles all
 * logic server-side for accuracy and performance.
 */
export async function getFilteredAvailableSchedules(
  professionalId: string,
  serviceId: string,
  date: Date,
): Promise<{ data: Schedule[] | null; error: any }> {
  // To fetch slots for a specific "Calendar Day" in Brazil (GMT-3),
  // we need to construct the UTC range that corresponds to that day.
  // 00:00 BRT = 03:00 UTC
  // 23:59 BRT = 02:59 UTC (+1 day)

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`

  // Construct UTC range for Brazil day
  const startDate = `${dateStr}T03:00:00.000Z`

  const nextDay = new Date(date)
  nextDay.setDate(date.getDate() + 1)
  const nyyyy = nextDay.getFullYear()
  const nmm = String(nextDay.getMonth() + 1).padStart(2, '0')
  const ndd = String(nextDay.getDate()).padStart(2, '0')
  const nextDateStr = `${nyyyy}-${nmm}-${ndd}`

  const endDate = `${nextDateStr}T02:59:59.999Z`

  const { data, error } = await supabase.rpc(
    'get_available_slots_for_service',
    {
      p_professional_id: professionalId,
      p_service_id: serviceId,
      p_start_date: startDate,
      p_end_date: endDate,
    },
  )

  if (error) {
    console.error('Error fetching schedules:', error)
  }

  return { data: data as Schedule[] | null, error }
}

// Retain for backward compatibility if used elsewhere, but simply alias the filtered one
export async function getAvailableSchedules(
  professionalId: string,
  serviceId: string,
  date: Date,
): Promise<{ data: Schedule[] | null; error: any }> {
  return getFilteredAvailableSchedules(professionalId, serviceId, date)
}

/**
 * Fetches list of professionals who have an available schedule slot at the specified date/time.
 * Used for "Intelligent Filtering".
 */
export async function getAvailableProfessionalsForSlot(
  date: Date,
): Promise<{ data: Professional[] | null; error: any }> {
  // Convert JS Date to ISO string to match database
  const timeStr = date.toISOString()

  // 1. Get all schedules at this exact time
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('id, professional_id, professionals(*)')
    .eq('start_time', timeStr)

  if (scheduleError || !schedules) {
    return { data: null, error: scheduleError }
  }

  if (schedules.length === 0) {
    return { data: [], error: null }
  }

  const scheduleIds = schedules.map((s) => s.id)

  // 2. Check existing bookings to filter out busy professionals
  // NOTE: This simple check does NOT account for capacity.
  // Ideally, this should also check capacity if we knew the service.
  // Without service ID, we assume we want professionals who are COMPLETELY free?
  // Or at least have SOME capacity?
  // Since we don't know the service here (user selects date first), we can't check capacity accurately.
  // So we default to checking if they have ANY booking, which might be too strict now.
  // However, without a service_id, we can't know if they can take more attendees.
  // For now, let's keep it as checking for completely free slots to be safe,
  // or we could relax it later if needed.
  // Actually, let's relax it: if they are booked, we can't check compatibility without service_id.
  // So showing them as available might lead to "Busy with other service" error later.
  // That is acceptable. The user will select a service and then see they are busy.

  const { data: bookedAppointments, error: appointmentError } = await supabase
    .from('appointments')
    .select('schedule_id')
    .in('schedule_id', scheduleIds)
    .neq('status', 'cancelled')

  if (appointmentError) {
    return { data: null, error: appointmentError }
  }

  const bookedScheduleIds = new Set(
    bookedAppointments?.map((a) => a.schedule_id) || [],
  )

  // 3. Filter schedules that are free
  const availableSchedules = schedules.filter(
    (s) => !bookedScheduleIds.has(s.id),
  )

  // 4. Extract professionals (unique)
  const professionalsMap = new Map<string, Professional>()
  availableSchedules.forEach((s) => {
    if (s.professionals) {
      professionalsMap.set(s.professional_id, s.professionals as Professional)
    }
  })

  return { data: Array.from(professionalsMap.values()), error: null }
}

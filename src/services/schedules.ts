import { supabase } from '@/lib/supabase/client'
import { Schedule, Professional } from '@/types'

/**
 * Fetches available schedules for a specific service and date,
 * respecting professional availability, overrides, and existing appointments.
 */
export async function getFilteredAvailableSchedules(
  professionalId: string,
  serviceId: string,
  date: Date,
): Promise<{ data: Schedule[] | null; error: any }> {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`

  // Construct UTC range for Brazil day
  // 00:00 BRT = 03:00 UTC
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

export async function getAvailableSchedules(
  professionalId: string,
  serviceId: string,
  date: Date,
): Promise<{ data: Schedule[] | null; error: any }> {
  return getFilteredAvailableSchedules(professionalId, serviceId, date)
}

/**
 * Fetches list of professionals who have an available schedule slot at the specified date/time.
 * Used for "Intelligent Filtering" in legacy flow.
 */
export async function getAvailableProfessionalsForSlot(
  date: Date,
): Promise<{ data: Professional[] | null; error: any }> {
  const timeStr = date.toISOString()

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

  const professionalsMap = new Map<string, Professional>()
  schedules.forEach((s) => {
    if (s.professionals) {
      professionalsMap.set(s.professional_id, s.professionals as Professional)
    }
  })

  return { data: Array.from(professionalsMap.values()), error: null }
}

/**
 * Fetches available professionals for a specific service and time slot.
 * Used for the new Context-Aware Appointment Modal.
 */
export async function getAvailableProfessionalsAtSlot(
  serviceId: string,
  date: Date,
): Promise<{ data: Professional[] | null; error: any }> {
  const timeStr = date.toISOString()

  const { data, error } = await supabase.rpc(
    'get_available_professionals_for_service_at_time',
    {
      p_service_id: serviceId,
      p_start_time: timeStr,
    },
  )

  return { data: data as Professional[] | null, error }
}

/**
 * Fetches the specific schedule ID for a professional at a given time.
 * Used to lock in the appointment.
 */
export async function getScheduleIdForSlot(
  professionalId: string,
  date: Date,
): Promise<{ data: string | null; error: any }> {
  const timeStr = date.toISOString()

  const { data, error } = await supabase
    .from('schedules')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('start_time', timeStr)
    .single()

  return { data: data?.id || null, error }
}

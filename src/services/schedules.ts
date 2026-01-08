import { supabase } from '@/lib/supabase/client'
import { Schedule, Professional } from '@/types'

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
  // We no longer check for occupancy, just pure availability (existence of schedule slot)
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

  // 2. Extract professionals (unique)
  const professionalsMap = new Map<string, Professional>()
  schedules.forEach((s) => {
    if (s.professionals) {
      professionalsMap.set(s.professional_id, s.professionals as Professional)
    }
  })

  return { data: Array.from(professionalsMap.values()), error: null }
}

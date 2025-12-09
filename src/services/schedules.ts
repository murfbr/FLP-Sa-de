import { supabase } from '@/lib/supabase/client'
import { Schedule } from '@/types'
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

  // We use the YYYY-MM-DD from the input date object (which comes from the calendar selection)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`

  // Construct UTC range for Brazil day
  // Start: 03:00:00 UTC
  const startDate = `${dateStr}T03:00:00.000Z`

  // End: 02:59:59.999 UTC of the next day
  // We can just add 1 day to the dateStr for the next part, or use calculation.
  // Easiest is to just ask for 27 hours from start (covering 03:00 to 06:00 next day is safe, RPC filters exact matches)
  // But let's be precise:
  // We want to pass the range to the RPC.
  // The RPC `get_available_slots_for_service` filters schedules where `start_time` is between p_start_date and p_end_date.
  // Ideally we want 00:00 BRT to 23:59:59 BRT.
  // So we pass the UTC equivalents.

  // Calculate next day date string
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

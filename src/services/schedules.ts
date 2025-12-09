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
  const startDate = format(date, "yyyy-MM-dd'T'00:00:00")
  const endDate = format(date, "yyyy-MM-dd'T'23:59:59")

  const { data, error } = await supabase.rpc(
    'get_available_slots_for_service',
    {
      p_professional_id: professionalId,
      p_service_id: serviceId,
      p_start_date: startDate,
      p_end_date: endDate,
    },
  )

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

import { supabase } from '@/lib/supabase/client'
import { Schedule } from '@/types'
import { startOfDay, endOfDay } from 'date-fns'

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
  // Use ISO strings with timezone information to ensure correct server-side parsing.
  // startOfDay/endOfDay uses the local browser time, and toISOString() converts it to UTC
  // which Postgres TIMESTAMPTZ expects.
  const startDate = startOfDay(date).toISOString()
  const endDate = endOfDay(date).toISOString()

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

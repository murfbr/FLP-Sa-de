import { supabase } from '@/lib/supabase/client'
import { Schedule, Professional } from '@/types'

/**
 * Fetches available schedules for a specific service and date,
 * respecting professional availability, overrides, and existing appointments.
 * Uses dynamic calculation on database side.
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

  // UTC range covering the full day in Brazil time (approx buffer)
  // Or just passing exact day range, let SQL handle timezone
  const startDate = `${dateStr}T00:00:00.000Z`
  const endDate = `${dateStr}T23:59:59.999Z`

  const { data, error } = await supabase.rpc('get_available_slots_dynamic', {
    p_professional_id: professionalId,
    p_service_id: serviceId,
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (error) {
    console.error('Error fetching dynamic schedules:', error)
  }

  // Map response to Schedule type
  const mappedData: Schedule[] =
    data?.map((slot: any) => ({
      id: slot.schedule_id, // Might be null, but compatible with Schedule type if optional
      professional_id: professionalId,
      start_time: slot.start_time,
      end_time: slot.end_time,
      current_count: slot.current_count,
      max_capacity: slot.max_capacity,
    })) || []

  return { data: mappedData, error }
}

export async function getAvailableSchedules(
  professionalId: string,
  serviceId: string,
  date: Date,
): Promise<{ data: Schedule[] | null; error: any }> {
  return getFilteredAvailableSchedules(professionalId, serviceId, date)
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
    'get_available_professionals_at_time_dynamic',
    {
      p_service_id: serviceId,
      p_start_time: timeStr,
    },
  )

  return { data: data as Professional[] | null, error }
}

/**
 * DEPRECATED: Dynamic flow uses start_time directly.
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

/**
 * Fetches list of professionals who have an available schedule slot at the specified date/time.
 * Used for "Intelligent Filtering" in legacy flow.
 */
export async function getAvailableProfessionalsForSlot(
  date: Date,
): Promise<{ data: Professional[] | null; error: any }> {
  // This logic is harder to implement purely dynamic without service context.
  // We recommend using getAvailableProfessionalsAtSlot with a Service ID.
  // For now, returning empty to encourage Service-First selection.
  return { data: [], error: null }
}

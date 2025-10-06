import { supabase } from '@/lib/supabase/client'
import { Appointment } from '@/types'

export async function bookAppointment(
  scheduleId: string,
  clientId: string,
  serviceId: string,
): Promise<{ data: { appointment_id: string } | null; error: any }> {
  const { data, error } = await supabase.rpc('book_appointment', {
    p_schedule_id: scheduleId,
    p_client_id: clientId,
    p_service_id: serviceId,
  })

  if (error) {
    return { data: null, error }
  }

  return { data: { appointment_id: data }, error: null }
}

export async function getAppointmentsByProfessional(
  professionalId: string,
): Promise<{ data: Appointment[] | null; error: any }> {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      id,
      status,
      created_at,
      clients (id, name, email),
      services (id, name),
      schedules (start_time, end_time)
    `,
    )
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })

  return { data: data as Appointment[] | null, error }
}

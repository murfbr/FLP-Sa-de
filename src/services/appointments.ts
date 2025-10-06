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

export async function getAppointmentsByProfessionalForRange(
  professionalId: string,
  startDate: string,
  endDate: string,
): Promise<{ data: Appointment[] | null; error: any }> {
  const { data: schedules, error: schedulesError } = await supabase
    .from('schedules')
    .select('id, start_time, end_time')
    .eq('professional_id', professionalId)
    .gte('start_time', startDate)
    .lte('start_time', endDate)

  if (schedulesError) return { data: null, error: schedulesError }
  if (!schedules || schedules.length === 0) return { data: [], error: null }

  const scheduleIds = schedules.map((s) => s.id)

  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select(
      `
      id,
      status,
      notes,
      schedule_id,
      clients (id, name, email),
      services (id, name, duration_minutes)
    `,
    )
    .in('schedule_id', scheduleIds)

  if (appointmentsError) return { data: null, error: appointmentsError }

  const appointmentsWithSchedule = appointments?.map((appt) => {
    const schedule = schedules.find((s) => s.id === appt.schedule_id)
    return {
      ...appt,
      schedules: schedule,
    }
  }) as Appointment[] | null

  return { data: appointmentsWithSchedule, error: null }
}

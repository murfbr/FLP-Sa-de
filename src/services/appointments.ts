import { supabase } from '@/lib/supabase/client'
import { Appointment } from '@/types'
import { format } from 'date-fns'

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

export async function getAllAppointments(
  professionalId?: string,
): Promise<{ data: Appointment[] | null; error: any }> {
  let query = supabase
    .from('appointments')
    .select(
      `
      id,
      status,
      clients (id, name, email),
      professionals (id, name),
      services (id, name),
      schedules (start_time, end_time)
    `,
    )
    .order('schedules(start_time)', { ascending: false })

  if (professionalId && professionalId !== 'all') {
    query = query.eq('professional_id', professionalId)
  }

  const { data, error } = await query

  return { data: data as Appointment[] | null, error }
}

export async function getUpcomingAppointments(): Promise<{
  data: Appointment[] | null
  error: any
}> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      id,
      status,
      clients (id, name),
      professionals (id, name),
      services (id, name),
      schedules (start_time)
    `,
    )
    .gte('schedules.start_time', now)
    .order('schedules(start_time)', { ascending: true })
    .limit(5)

  return { data: data as Appointment[] | null, error }
}

export async function getAppointmentsByClientId(
  clientId: string,
): Promise<{ data: Appointment[] | null; error: any }> {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      id,
      status,
      created_at,
      professionals (id, name),
      services (id, name),
      schedules (start_time, end_time)
    `,
    )
    .eq('client_id', clientId)
    .order('schedules(start_time)', { ascending: false })

  return { data: data as Appointment[] | null, error }
}

export async function getCompletedAppointmentsCount(
  startDate: string,
  endDate: string,
): Promise<{ data: number | null; error: any }> {
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('schedules.start_time', startDate)
    .lte('schedules.start_time', endDate)

  return { data: count, error }
}

export async function getFutureAppointmentsCount(): Promise<{
  data: number | null
  error: any
}> {
  const now = new Date().toISOString()
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['scheduled', 'confirmed'])
    .gte('schedules.start_time', now)

  return { data: count, error }
}

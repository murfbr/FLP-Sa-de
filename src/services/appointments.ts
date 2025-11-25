import { supabase } from '@/lib/supabase/client'
import { Appointment, NoteEntry } from '@/types'

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
      services (id, name, duration_minutes),
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
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      id,
      status,
      notes,
      client_id,
      professional_id,
      clients:clients (id, name, email),
      services:services (id, name, duration_minutes),
      schedules:schedules (id, start_time, end_time)
    `,
    )
    .eq('professional_id', professionalId)
    .gte('schedules.start_time', startDate)
    .lte('schedules.start_time', endDate)

  return { data: data as Appointment[] | null, error }
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
      notes,
      clients (id, name, email),
      professionals (id, name),
      services (id, name, duration_minutes),
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
      notes,
      clients (id, name),
      professionals (id, name),
      services (id, name, duration_minutes),
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
      notes,
      created_at,
      professionals (id, name),
      services (id, name, duration_minutes),
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

export async function addAppointmentNote(
  appointmentId: string,
  note: NoteEntry,
): Promise<{ error: any }> {
  // First fetch existing notes
  const { data: currentData, error: fetchError } = await supabase
    .from('appointments')
    .select('notes')
    .eq('id', appointmentId)
    .single()

  if (fetchError) return { error: fetchError }

  const currentNotes: NoteEntry[] = (currentData.notes as any) || []
  const updatedNotes = [...currentNotes, note]

  const { error } = await supabase
    .from('appointments')
    .update({ notes: updatedNotes as any })
    .eq('id', appointmentId)

  return { error }
}

export async function completeAppointment(
  appointmentId: string,
): Promise<{ error: any }> {
  const { error } = await supabase.rpc('complete_appointment', {
    p_appointment_id: appointmentId,
  })
  return { error }
}

export async function markAppointmentAsNoShow(
  appointmentId: string,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'no_show' })
    .eq('id', appointmentId)
  return { error }
}

export async function cancelAppointment(
  appointmentId: string,
): Promise<{ error: any }> {
  const { error } = await supabase.rpc('cancel_appointment', {
    p_appointment_id: appointmentId,
  })
  return { error }
}

export async function rescheduleAppointment(
  appointmentId: string,
  newScheduleId: string,
): Promise<{ error: any }> {
  const { error } = await supabase.rpc('reschedule_appointment', {
    p_appointment_id: appointmentId,
    p_new_schedule_id: newScheduleId,
  })
  return { error }
}

import { supabase } from '@/lib/supabase/client'
import { Appointment, NoteEntry } from '@/types'

export async function bookAppointment(
  professionalId: string,
  clientId: string,
  serviceId: string,
  startTime: string,
  clientPackageId?: string,
  isRecurring: boolean = false,
  discountAmount: number = 0,
): Promise<{ data: { appointment_id: string } | null; error: any }> {
  console.log('[AppointmentService] bookAppointment called with:', {
    professionalId,
    clientId,
    serviceId,
    startTime,
    clientPackageId,
    isRecurring,
    discountAmount,
  })

  if (!professionalId || !clientId || !serviceId || !startTime) {
    return {
      data: null,
      error: { message: 'Parâmetros obrigatórios faltando.' },
    }
  }

  const { data, error } = await supabase.rpc('book_appointment_dynamic', {
    p_professional_id: professionalId,
    p_client_id: clientId,
    p_service_id: serviceId,
    p_start_time: startTime,
    p_client_package_id: clientPackageId || null,
    p_is_recurring: isRecurring,
  })

  if (error) {
    console.error('[AppointmentService] RPC Error:', error)
    return { data: null, error }
  }

  // Apply discount if present
  if (discountAmount > 0 && data) {
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ discount_amount: discountAmount })
      .eq('id', data)

    if (updateError) {
      console.error(
        '[AppointmentService] Error applying discount:',
        updateError,
      )
    }
  }

  return { data: { appointment_id: data }, error: null }
}

export async function bookRecurringAppointments(
  professionalId: string,
  clientId: string,
  serviceId: string,
  startTime: string,
  weeks: number,
  clientPackageId?: string,
  discountAmount: number = 0,
): Promise<{ error: any }> {
  if (weeks < 2) {
    return bookAppointment(
      professionalId,
      clientId,
      serviceId,
      startTime,
      clientPackageId,
      true,
      discountAmount,
    )
  }

  const { error } = await supabase.rpc('book_recurring_appointment_series', {
    p_professional_id: professionalId,
    p_client_id: clientId,
    p_service_id: serviceId,
    p_start_time: startTime,
    p_client_package_id: clientPackageId || null,
    p_occurrences: weeks,
  })

  return { error }
}

export async function rescheduleAppointment(
  appointmentId: string,
  newProfessionalId: string,
  newStartTime: string,
): Promise<{ error: any }> {
  const { error } = await supabase.rpc('reschedule_appointment_dynamic', {
    p_appointment_id: appointmentId,
    p_new_professional_id: newProfessionalId,
    p_new_start_time: newStartTime,
  })
  return { error }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
  return { error }
}

export async function updateAppointment(
  appointmentId: string,
  updates: Partial<Appointment>,
): Promise<{ data: Appointment | null; error: any }> {
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select()
    .single()
  return { data, error }
}

export async function deleteAppointment(
  appointmentId: string,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)
  return { error }
}

export async function getAppointmentsPaginated(
  page: number,
  pageSize: number,
  filters: {
    professionalId?: string
    startDate?: Date
    endDate?: Date
  },
): Promise<{ data: Appointment[] | null; count: number | null; error: any }> {
  const startISO = filters.startDate?.toISOString()
  const endISO = filters.endDate?.toISOString()

  let query = supabase.from('appointments').select(
    `
      id, status, notes, discount_amount, created_at,
      clients (id, name, email),
      professionals (id, name),
      services (id, name, duration_minutes, max_attendees, price),
      schedules!inner (start_time, end_time)
    `,
    { count: 'exact' },
  )

  if (filters.professionalId && filters.professionalId !== 'all') {
    query = query.eq('professional_id', filters.professionalId)
  }

  if (startISO) {
    query = query.gte('schedules.start_time', startISO)
  }

  if (endISO) {
    query = query.lte('schedules.start_time', endISO)
  }

  query = query
    .order('start_time', { foreignTable: 'schedules', ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query

  return { data: data as Appointment[] | null, count, error }
}

export async function getAppointmentsForRange(
  startDate: Date,
  endDate: Date,
  professionalId?: string,
): Promise<{ data: Appointment[] | null; error: any }> {
  const startISO = startDate.toISOString()
  const endISO = endDate.toISOString()

  let query = supabase
    .from('appointments')
    .select(
      `
      id, status, notes, discount_amount, created_at,
      clients (id, name, email),
      professionals (id, name),
      services (id, name, duration_minutes, max_attendees, price),
      schedules!inner (start_time, end_time)
    `,
    )
    .gte('schedules.start_time', startISO)
    .lte('schedules.start_time', endISO)

  if (professionalId && professionalId !== 'all') {
    query = query.eq('professional_id', professionalId)
  }

  query = query.order('start_time', {
    foreignTable: 'schedules',
    ascending: true,
  })

  const { data, error } = await query

  return { data: data as Appointment[] | null, error }
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
      services (id, name, duration_minutes, max_attendees),
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
      discount_amount,
      client_id,
      professional_id,
      schedule_id,
      clients:clients (id, name, email),
      services:services (id, name, duration_minutes, max_attendees),
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
      services (id, name, duration_minutes, max_attendees),
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
      services (id, name, duration_minutes, max_attendees),
      schedules (start_time)
    `,
    )
    .gte('schedules.start_time', now)
    .neq('status', 'cancelled')
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
      services (id, name, duration_minutes, max_attendees),
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

export async function getAppointmentsByScheduleId(
  scheduleId: string,
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
      schedule_id,
      clients:clients (id, name, email),
      services:services (id, name, duration_minutes, max_attendees),
      schedules:schedules (id, start_time, end_time)
    `,
    )
    .eq('schedule_id', scheduleId)

  return { data: data as Appointment[] | null, error }
}

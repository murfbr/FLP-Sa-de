import { supabase } from '@/lib/supabase/client'
import { Client } from '@/types'

export async function getClientsByProfessional(
  professionalId: string,
): Promise<{ data: Client[] | null; error: any }> {
  // This query assumes a client is associated with a professional if they have an appointment.
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('client_id')
    .eq('professional_id', professionalId)

  if (error || !appointments) {
    return { data: null, error }
  }

  const clientIds = [...new Set(appointments.map((a) => a.client_id))]

  if (clientIds.length === 0) {
    return { data: [], error: null }
  }

  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .in('id', clientIds)

  return { data: clients, error: clientError }
}

export async function getAllClients(): Promise<{
  data: Client[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  return { data, error }
}

export async function getClientById(
  clientId: string,
): Promise<{ data: Client | null; error: any }> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  return { data, error }
}

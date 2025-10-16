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
    .select('*, partnerships(*)')
    .in('id', clientIds)
    .eq('is_active', true) // Professionals should only see active clients

  return { data: clients, error: clientError }
}

export async function getAllClients(filter?: {
  status?: 'all' | 'active' | 'inactive'
}): Promise<{ data: Client[] | null; error: any }> {
  let query = supabase
    .from('clients')
    .select('*, partnerships(*)')
    .order('name', { ascending: true })

  if (filter?.status === 'active') {
    query = query.eq('is_active', true)
  } else if (filter?.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  const { data, error } = await query
  return { data, error }
}

export async function getClientById(
  clientId: string,
): Promise<{ data: Client | null; error: any }> {
  const { data, error } = await supabase
    .from('clients')
    .select('*, partnerships(*)')
    .eq('id', clientId)
    .single()

  return { data, error }
}

export async function createClient(
  clientData: Omit<Client, 'id' | 'created_at' | 'user_id' | 'is_active'>,
): Promise<{ data: Client | null; error: any }> {
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...clientData, is_active: true })
    .select()
    .single()
  return { data, error }
}

export async function updateClient(
  clientId: string,
  updates: Partial<Omit<Client, 'id' | 'created_at' | 'user_id'>>,
): Promise<{ data: Client | null; error: any }> {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single()
  return { data, error }
}

export async function deleteClient(clientId: string): Promise<{ error: any }> {
  const { error } = await supabase.from('clients').delete().eq('id', clientId)
  return { error }
}

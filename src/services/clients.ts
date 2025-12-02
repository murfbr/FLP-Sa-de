import { supabase } from '@/lib/supabase/client'
import {
  Client,
  ClientPackageWithDetails,
  ClientSubscription,
  SubscriptionStatus,
} from '@/types'

export async function getClientsByProfessional(
  professionalId: string,
): Promise<{ data: Client[] | null; error: any }> {
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
    .eq('is_active', true)

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
  updates: Partial<Client>,
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

export async function getClientPackages(
  clientId: string,
): Promise<{ data: ClientPackageWithDetails[] | null; error: any }> {
  const { data, error } = await supabase
    .from('client_packages')
    .select('*, packages(*)')
    .eq('client_id', clientId)
    .gt('sessions_remaining', 0)
    .order('purchase_date', { ascending: false })

  return { data: data as ClientPackageWithDetails[] | null, error }
}

// Subscription Methods

export async function getClientSubscriptions(
  clientId: string,
): Promise<{ data: ClientSubscription[] | null; error: any }> {
  const { data, error } = await supabase
    .from('client_subscriptions')
    .select('*, services(*)')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return { data: data as ClientSubscription[] | null, error }
}

export async function createClientSubscription(
  subscriptionData: Omit<
    ClientSubscription,
    'id' | 'created_at' | 'updated_at' | 'services'
  >,
): Promise<{ data: ClientSubscription | null; error: any }> {
  const { data, error } = await supabase
    .from('client_subscriptions')
    .insert(subscriptionData)
    .select()
    .single()
  return { data, error }
}

export async function updateClientSubscription(
  subscriptionId: string,
  updates: Partial<ClientSubscription>,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('client_subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
  return { error }
}

export async function cancelClientSubscription(
  subscriptionId: string,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('client_subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subscriptionId)
  return { error }
}

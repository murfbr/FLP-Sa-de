import { supabase } from '@/lib/supabase/client'
import { Client, ClientPackageWithDetails, ClientSubscription } from '@/types'
import { format, startOfMonth, endOfMonth } from 'date-fns'

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
  serviceId?: string
}): Promise<{ data: Client[] | null; error: any }> {
  let clientIds: string[] | null = null

  // If filtering by service, we need to find clients associated with that service
  if (filter?.serviceId && filter.serviceId !== 'all') {
    // 1. Get clients with subscriptions to this service
    const { data: subData, error: subError } = await supabase
      .from('client_subscriptions')
      .select('client_id')
      .eq('service_id', filter.serviceId)

    if (subError) {
      return { data: null, error: subError }
    }

    // 2. Get clients with packages that belong to this service
    // We use the foreign key relationship to filter by package -> service_id
    const { data: pkgData, error: pkgError } = await supabase
      .from('client_packages')
      .select('client_id, packages!inner(service_id)')
      .eq('packages.service_id', filter.serviceId)

    if (pkgError) {
      return { data: null, error: pkgError }
    }

    // Combine unique client IDs from both sources
    const subIds = subData?.map((d) => d.client_id) || []
    const pkgIds = pkgData?.map((d) => d.client_id) || []
    clientIds = [...new Set([...subIds, ...pkgIds])]

    // If no clients found for this service, we can return empty immediately
    if (clientIds.length === 0) {
      return { data: [], error: null }
    }
  }

  let query = supabase
    .from('clients')
    .select('*, partnerships(*)')
    .order('name', { ascending: true })

  if (filter?.status === 'active') {
    query = query.eq('is_active', true)
  } else if (filter?.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  // If we have a list of client IDs from the service filter, apply it
  if (clientIds !== null) {
    query = query.in('id', clientIds)
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

export async function getClientPackages(clientId: string): Promise<{
  data: (ClientPackageWithDetails & { status?: string })[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('client_packages')
    .select('*, packages(*)')
    .eq('client_id', clientId)
    .order('purchase_date', { ascending: false })

  return { data: data as any, error }
}

export async function getAllActiveClientPackages(): Promise<{
  data: any[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('client_packages')
    .select('*, packages(*), clients(name)')
    .eq('status', 'active')
    .gt('sessions_remaining', 0)
    .order('purchase_date', { ascending: true })

  return { data, error }
}

export async function assignPackageToClient(
  clientId: string,
  packageId: string,
  sessions: number,
  purchaseDate?: Date,
): Promise<{ error: any }> {
  const { error } = await supabase.from('client_packages').insert({
    client_id: clientId,
    package_id: packageId,
    sessions_remaining: sessions,
    purchase_date: purchaseDate
      ? purchaseDate.toISOString()
      : new Date().toISOString(),
    status: 'active',
  })
  return { error }
}

export async function cancelClientPackage(
  clientPackageId: string,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('client_packages')
    .update({ status: 'cancelled' })
    .eq('id', clientPackageId)
  return { error }
}

// Subscription Methods

export async function getClientSubscriptions(
  clientId: string,
): Promise<{ data: ClientSubscription[] | null; error: any }> {
  const { data, error } = await supabase
    .from('client_subscriptions')
    .select('*, services(*), subscription_plans(*)')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return { data: data as ClientSubscription[] | null, error }
}

export async function createClientSubscription(
  subscriptionData: Omit<
    ClientSubscription,
    'id' | 'created_at' | 'updated_at' | 'services' | 'subscription_plans'
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

export async function exportClientData(
  clientId: string,
  exportType: 'session_notes' | 'general_assessment',
  formatType: 'pdf' | 'docx',
): Promise<{ data: { content: string; filename: string } | null; error: any }> {
  const { data, error } = await supabase.functions.invoke(
    'export-client-data',
    {
      body: { clientId, exportType, format: formatType },
    },
  )

  if (error) return { data: null, error }
  return { data, error: null }
}

export async function getClientsWithBirthdayThisWeek(
  startDate: Date,
  endDate: Date,
): Promise<{ data: Client[] | null; error: any }> {
  const { data, error } = await supabase.rpc(
    'get_clients_with_birthday_this_week',
    {
      p_start_date: format(startDate, 'yyyy-MM-dd'),
      p_end_date: format(endDate, 'yyyy-MM-dd'),
    },
  )

  return { data, error }
}

export async function getMonthlyClientUsage(
  clientId: string,
  serviceId: string,
): Promise<{ count: number; error: any }> {
  const start = startOfMonth(new Date()).toISOString()
  const end = endOfMonth(new Date()).toISOString()

  const { count: safeCount, error: safeError } = await supabase
    .from('appointments')
    .select('id, schedules!inner(start_time)', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('service_id', serviceId)
    .eq('status', 'completed')
    .gte('schedules.start_time', start)
    .lte('schedules.start_time', end)

  return { count: safeCount || 0, error: safeError }
}

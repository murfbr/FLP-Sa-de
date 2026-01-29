import { supabase } from '@/lib/supabase/client'
import { ClientSubscription } from '@/types'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export async function getInvoicedValue(
  startDate: string,
  endDate: string,
): Promise<{ data: number | null; error: any }> {
  const { data, error } = await supabase
    .from('financial_records')
    .select('amount')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)

  if (error) return { data: null, error }

  const total = data.reduce((sum, record) => sum + record.amount, 0)
  return { data: total, error: null }
}

export async function getExpectedRevenue(): Promise<{
  data: number | null
  error: any
}> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('appointments')
    .select('services(price)')
    .eq('status', 'scheduled')
    .gte('schedules.start_time', now)

  if (error) return { data: null, error }

  const total = data.reduce(
    (sum, record) => sum + (record.services?.price || 0),
    0,
  )
  return { data: total, error: null }
}

export async function getActiveSubscriptions(): Promise<{
  data: ClientSubscription[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('client_subscriptions')
    .select(
      '*, clients(id, name, email), services(name, price), subscription_plans(name, price)',
    )
    .eq('status', 'active')

  return { data: data as ClientSubscription[], error }
}

export async function getSubscriptionPayments(
  subscriptionIds: string[],
  monthDate: Date,
): Promise<{ data: any[] | null; error: any }> {
  const start = startOfMonth(monthDate).toISOString()
  const end = endOfMonth(monthDate).toISOString()

  const { data, error } = await supabase
    .from('financial_records')
    .select('client_subscription_id, payment_date')
    .in('client_subscription_id', subscriptionIds)
    .gte('payment_date', start)
    .lte('payment_date', end)

  return { data, error }
}

export async function paySubscription(
  subscription: ClientSubscription,
  professionalId: string,
): Promise<{ error: any }> {
  const amount =
    subscription.subscription_plans?.price || subscription.services?.price || 0
  const description = `Mensalidade ${subscription.subscription_plans?.name || subscription.services?.name} - ${format(new Date(), 'MM/yyyy')}`

  const { error } = await supabase.from('financial_records').insert({
    client_id: subscription.client_id,
    professional_id: professionalId, // The admin marking it as paid
    client_subscription_id: subscription.id,
    amount: amount,
    payment_date: new Date().toISOString(),
    description: description,
    payment_method: 'manual', // Could be enhanced later
  } as any)

  return { error }
}

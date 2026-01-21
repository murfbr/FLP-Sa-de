import { supabase } from '@/lib/supabase/client'
import { SubscriptionPlan } from '@/types'

export async function getSubscriptionPlans(
  serviceId?: string,
): Promise<{ data: SubscriptionPlan[] | null; error: any }> {
  let query = supabase
    .from('subscription_plans')
    .select('*')
    .order('name', { ascending: true })

  if (serviceId) {
    query = query.eq('service_id', serviceId)
  }

  const { data, error } = await query
  return { data, error }
}

export async function createSubscriptionPlan(
  plan: Omit<SubscriptionPlan, 'id' | 'created_at'>,
): Promise<{ data: SubscriptionPlan | null; error: any }> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert(plan)
    .select()
    .single()
  return { data, error }
}

export async function updateSubscriptionPlan(
  id: string,
  plan: Partial<Omit<SubscriptionPlan, 'id' | 'created_at'>>,
): Promise<{ data: SubscriptionPlan | null; error: any }> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update(plan)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteSubscriptionPlan(
  id: string,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('subscription_plans')
    .delete()
    .eq('id', id)
  return { error }
}

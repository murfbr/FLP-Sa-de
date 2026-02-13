import { supabase } from '@/lib/supabase/client'
import { SubscriptionPlan } from '@/types'

export async function getSubscriptionPlans(
  serviceId?: string,
  includeInactive = false,
): Promise<{ data: SubscriptionPlan[] | null; error: any }> {
  let query = supabase
    .from('subscription_plans')
    .select('*')
    .order('name', { ascending: true })

  if (serviceId) {
    query = query.eq('service_id', serviceId)
  }

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  return { data, error }
}

export async function createSubscriptionPlan(
  plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'is_active'>,
): Promise<{ data: SubscriptionPlan | null; error: any }> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert({ ...plan, is_active: true })
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
  // Soft delete: set is_active to false instead of removing the row
  const { error } = await supabase
    .from('subscription_plans')
    .update({ is_active: false })
    .eq('id', id)
  return { error }
}

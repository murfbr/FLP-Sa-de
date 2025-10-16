import { supabase } from '@/lib/supabase/client'
import { Partnership, PartnershipDiscount } from '@/types'

// Partnership CRUD
export async function getAllPartnerships(): Promise<{
  data: Partnership[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('partnerships')
    .select('*')
    .order('name')
  return { data, error }
}

export async function createPartnership(
  partnership: Omit<Partnership, 'id' | 'created_at'>,
): Promise<{ data: Partnership | null; error: any }> {
  const { data, error } = await supabase
    .from('partnerships')
    .insert(partnership)
    .select()
    .single()
  return { data, error }
}

export async function updatePartnership(
  id: string,
  updates: Partial<Omit<Partnership, 'id' | 'created_at'>>,
): Promise<{ data: Partnership | null; error: any }> {
  const { data, error } = await supabase
    .from('partnerships')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deletePartnership(id: string): Promise<{ error: any }> {
  const { error } = await supabase.from('partnerships').delete().eq('id', id)
  return { error }
}

// Partnership Discounts CRUD
export async function getDiscountsForPartnership(
  partnershipId: string,
): Promise<{ data: PartnershipDiscount[] | null; error: any }> {
  const { data, error } = await supabase
    .from('partnership_discounts')
    .select('*, services(name)')
    .eq('partnership_id', partnershipId)
  return { data, error }
}

export async function setPartnershipDiscounts(
  partnershipId: string,
  discounts: Omit<
    PartnershipDiscount,
    'id' | 'created_at' | 'partnership_id'
  >[],
): Promise<{ error: any }> {
  const { error: deleteError } = await supabase
    .from('partnership_discounts')
    .delete()
    .eq('partnership_id', partnershipId)

  if (deleteError) return { error: deleteError }

  if (discounts.length > 0) {
    const discountsToInsert = discounts.map((d) => ({
      ...d,
      partnership_id: partnershipId,
    }))
    const { error: insertError } = await supabase
      .from('partnership_discounts')
      .insert(discountsToInsert)
    return { error: insertError }
  }

  return { error: null }
}

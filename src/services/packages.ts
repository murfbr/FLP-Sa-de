import { supabase } from '@/lib/supabase/client'
import { Package } from '@/types'

export async function getPackages(includeInactive = false): Promise<{
  data: Package[] | null
  error: any
}> {
  let query = supabase
    .from('packages')
    .select('*, services(*)')
    .order('name', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  return { data: data as Package[] | null, error }
}

export async function createPackage(
  pkg: Omit<Package, 'id' | 'services' | 'is_active'>,
): Promise<{ data: Package | null; error: any }> {
  const { data, error } = await supabase
    .from('packages')
    .insert({ ...pkg, is_active: true })
    .select()
    .single()
  return { data, error }
}

export async function updatePackage(
  id: string,
  pkg: Partial<Omit<Package, 'id' | 'services'>>,
): Promise<{ data: Package | null; error: any }> {
  const { data, error } = await supabase
    .from('packages')
    .update(pkg)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deletePackage(id: string): Promise<{ error: any }> {
  // Soft delete: set is_active to false instead of removing the row
  const { error } = await supabase
    .from('packages')
    .update({ is_active: false })
    .eq('id', id)
  return { error }
}

import { supabase } from '@/lib/supabase/client'
import { Package } from '@/types'

export async function getPackages(): Promise<{
  data: Package[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('packages')
    .select('*, services(*)')
    .order('name', { ascending: true })

  return { data: data as Package[] | null, error }
}

export async function createPackage(
  pkg: Omit<Package, 'id' | 'services'>,
): Promise<{ data: Package | null; error: any }> {
  const { data, error } = await supabase
    .from('packages')
    .insert(pkg)
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
  const { error } = await supabase.from('packages').delete().eq('id', id)
  return { error }
}

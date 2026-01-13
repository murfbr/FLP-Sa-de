import { supabase } from '@/lib/supabase/client'
import { Service } from '@/types'

export async function getServices(): Promise<{
  data: Service[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true })
  return { data, error }
}

export async function createService(
  service: Omit<Service, 'id'>,
): Promise<{ data: Service | null; error: any }> {
  const { data, error } = await supabase
    .from('services')
    .insert(service)
    .select()
    .single()
  return { data, error }
}

export async function updateService(
  serviceId: string,
  service: Partial<Omit<Service, 'id'>>,
): Promise<{ data: Service | null; error: any }> {
  const { data, error } = await supabase
    .from('services')
    .update(service)
    .eq('id', serviceId)
    .select()
    .single()
  return { data, error }
}

export async function deleteService(
  serviceId: string,
): Promise<{ error: any }> {
  const { error } = await supabase.from('services').delete().eq('id', serviceId)
  return { error }
}

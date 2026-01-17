import { supabase } from '@/lib/supabase/client'
import { Professional, Service } from '@/types'

type ProfessionalServiceLink = {
  professionals: Professional
}

export async function getProfessionalsByService(
  serviceId: string,
): Promise<{ data: Professional[] | null; error: any }> {
  const { data, error } = await supabase
    .from('professional_services')
    .select('professionals(*)')
    .eq('service_id', serviceId)

  if (error) {
    return { data: null, error }
  }

  const professionals = data
    ?.map((item) => (item as ProfessionalServiceLink).professionals)
    .filter(Boolean)

  return { data: professionals || null, error: null }
}

export async function getAllProfessionals(): Promise<{
  data: Professional[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .order('name', { ascending: true })

  return { data, error }
}

export async function getProfessionalById(
  id: string,
): Promise<{ data: Professional | null; error: any }> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function updateProfessional(
  id: string,
  updates: Partial<Omit<Professional, 'id' | 'created_at' | 'user_id'>>,
): Promise<{ data: Professional | null; error: any }> {
  const { data, error } = await supabase
    .from('professionals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteProfessional(id: string): Promise<{ error: any }> {
  const { error } = await supabase.from('professionals').delete().eq('id', id)
  return { error }
}

export async function getServicesByProfessional(
  professionalId: string,
): Promise<{ data: Service[] | null; error: any }> {
  const { data, error } = await supabase
    .from('professional_services')
    .select('services(*)')
    .eq('professional_id', professionalId)

  if (error) {
    return { data: null, error }
  }

  const services = data?.map((item: any) => item.services).filter(Boolean)
  return { data: services || null, error: null }
}

export async function addServiceToProfessional(
  professionalId: string,
  serviceId: string,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('professional_services')
    .insert({ professional_id: professionalId, service_id: serviceId })
  return { error }
}

export async function removeServiceFromProfessional(
  professionalId: string,
  serviceId: string,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('professional_services')
    .delete()
    .eq('professional_id', professionalId)
    .eq('service_id', serviceId)
  return { error }
}

export async function createProfessionalUser(
  data: any,
): Promise<{ data: any; error: any }> {
  const { data: result, error } = await supabase.functions.invoke(
    'create-professional',
    {
      body: data,
    },
  )
  if (error) return { data: null, error }
  if (!result.success)
    return { data: null, error: { message: result.error || 'Unknown error' } }
  return { data: result.data, error: null }
}

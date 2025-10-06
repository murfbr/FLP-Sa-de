import { supabase } from '@/lib/supabase/client'
import { Professional } from '@/types'

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

import { supabase } from '@/lib/supabase/client'
import { Service } from '@/types'

export async function getAllServices(): Promise<{
  data: Service[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name')
  return { data, error }
}

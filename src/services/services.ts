import { supabase } from '@/lib/supabase/client'
import { Service } from '@/types'

export async function getServices(): Promise<{
  data: Service[] | null
  error: any
}> {
  const { data, error } = await supabase.from('services').select('*')
  return { data, error }
}

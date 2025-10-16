import { supabase } from '@/lib/supabase/client'

export const generateSchedules = async () => {
  const { data, error } = await supabase.functions.invoke('generate-schedules')
  return { data, error }
}

import { supabase } from '@/lib/supabase/client'

export const generateSchedules = async (professionalId?: string) => {
  // Pass professional_id in the body if provided, to optimize generation
  const { data, error } = await supabase.functions.invoke(
    'generate-schedules',
    {
      body: { professional_id: professionalId },
    },
  )
  return { data, error }
}

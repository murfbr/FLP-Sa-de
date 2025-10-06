import { supabase } from '@/lib/supabase/client'
import { Schedule } from '@/types'
import { format } from 'date-fns'

export async function getAvailableSchedules(
  professionalId: string,
  date: Date,
): Promise<{ data: Schedule[] | null; error: any }> {
  const startDate = format(date, "yyyy-MM-dd'T'00:00:00")
  const endDate = format(date, "yyyy-MM-dd'T'23:59:59")

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('is_booked', false)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: true })

  return { data, error }
}

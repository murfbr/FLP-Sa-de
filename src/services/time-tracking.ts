import { supabase } from '@/lib/supabase/client'
import { TimeRecord } from '@/types'
import { format } from 'date-fns'

export async function getTodayRecord(
  professionalId: string,
): Promise<{ data: TimeRecord | null; error: any }> {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data, error } = await supabase
    .from('time_tracking')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('date', today)
    .is('clock_out', null)
    .order('created_at', { ascending: false })
    .maybeSingle()

  // Cast to TimeRecord because database types might not be updated yet in local
  return { data: data as TimeRecord | null, error }
}

export async function clockIn(
  professionalId: string,
): Promise<{ data: TimeRecord | null; error: any }> {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const time = format(now, 'HH:mm:ss')

  const { data, error } = await supabase
    .from('time_tracking')
    .insert({
      professional_id: professionalId,
      date: today,
      clock_in: time,
    } as any)
    .select()
    .single()

  return { data: data as TimeRecord, error }
}

export async function clockOut(
  recordId: string,
): Promise<{ data: TimeRecord | null; error: any }> {
  const now = new Date()
  const time = format(now, 'HH:mm:ss')

  const { data, error } = await supabase
    .from('time_tracking')
    .update({
      clock_out: time,
    } as any)
    .eq('id', recordId)
    .select()
    .single()

  return { data: data as TimeRecord, error }
}

export async function getMonthlyTimeRecords(
  professionalId: string,
  year: number,
  month: number,
): Promise<{ data: TimeRecord[] | null; error: any }> {
  // Month is 0-indexed in JS Date but usually 1-indexed in UI. Let's assume 1-indexed input.
  // Construct date range
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  // End date logic: get first day of next month, then subtract 1 day?
  // Or just query by string comparison
  const endDateStr =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('time_tracking')
    .select('*')
    .eq('professional_id', professionalId)
    .gte('date', startDate)
    .lt('date', endDateStr)
    .order('date', { ascending: true })
    .order('clock_in', { ascending: true })

  return { data: data as TimeRecord[], error }
}

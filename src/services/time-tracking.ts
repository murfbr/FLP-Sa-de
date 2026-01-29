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
    .order('created_at', { ascending: false })
    .maybeSingle()

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

export async function upsertTimeRecord(
  professionalId: string,
  date: string,
  clockInTime: string,
  clockOutTime: string | null,
): Promise<{ data: TimeRecord | null; error: any }> {
  // Check if record exists
  const { data: existing } = await supabase
    .from('time_tracking')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('date', date)
    .maybeSingle()

  let result
  if (existing) {
    result = await supabase
      .from('time_tracking')
      .update({
        clock_in: clockInTime,
        clock_out: clockOutTime,
      } as any)
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabase
      .from('time_tracking')
      .insert({
        professional_id: professionalId,
        date: date,
        clock_in: clockInTime,
        clock_out: clockOutTime,
      } as any)
      .select()
      .single()
  }

  return { data: result.data as TimeRecord, error: result.error }
}

export async function getMonthlyTimeRecords(
  professionalId: string,
  year: number,
  month: number,
): Promise<{ data: TimeRecord[] | null; error: any }> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  // Simple next month calculation
  let endYear = year
  let endMonth = month + 1
  if (endMonth > 12) {
    endMonth = 1
    endYear = year + 1
  }
  const endDateStr = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

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

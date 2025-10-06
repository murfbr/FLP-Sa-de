import { supabase } from '@/lib/supabase/client'

export async function getInvoicedValue(
  startDate: string,
  endDate: string,
): Promise<{ data: number | null; error: any }> {
  const { data, error } = await supabase
    .from('financial_records')
    .select('amount')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)

  if (error) return { data: null, error }

  const total = data.reduce((sum, record) => sum + record.amount, 0)
  return { data: total, error: null }
}

export async function getExpectedRevenue(): Promise<{
  data: number | null
  error: any
}> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('appointments')
    .select('services(price)')
    .eq('status', 'scheduled')
    .gte('schedules.start_time', now)

  if (error) return { data: null, error }

  const total = data.reduce(
    (sum, record) => sum + (record.services?.price || 0),
    0,
  )
  return { data: total, error: null }
}

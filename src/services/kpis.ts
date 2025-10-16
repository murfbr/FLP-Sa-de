import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

export async function getKpiMetrics(startDate: Date, endDate: Date) {
  const { data, error } = await supabase.rpc('get_kpi_metrics', {
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
  })
  return { data: data?.[0] || null, error }
}

export async function getServicePerformance(startDate: Date, endDate: Date) {
  const { data, error } = await supabase.rpc('get_service_performance', {
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
  })
  return { data, error }
}

export async function getPartnershipPerformance(
  startDate: Date,
  endDate: Date,
) {
  const { data, error } = await supabase.rpc('get_partnership_performance', {
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
  })
  return { data, error }
}

export async function getAnnualComparative() {
  const { data, error } = await supabase.rpc('get_annual_comparative')
  return { data, error }
}

import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface KpiFilters {
  professionalId?: string | null
  serviceId?: string | null
  partnershipId?: string | null
}

export async function getKpiMetrics(
  startDate: Date,
  endDate: Date,
  filters?: KpiFilters,
) {
  const { data, error } = await supabase.rpc('get_kpi_metrics', {
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
    p_professional_id:
      filters?.professionalId === 'all' ? null : filters?.professionalId,
    p_service_id: filters?.serviceId === 'all' ? null : filters?.serviceId,
    p_partnership_id:
      filters?.partnershipId === 'all' ? null : filters?.partnershipId,
  })
  return { data: data?.[0] || null, error }
}

export async function getServicePerformance(
  startDate: Date,
  endDate: Date,
  filters?: KpiFilters,
) {
  const { data, error } = await supabase.rpc('get_service_performance', {
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
    p_professional_id:
      filters?.professionalId === 'all' ? null : filters?.professionalId,
    p_service_id: filters?.serviceId === 'all' ? null : filters?.serviceId,
    p_partnership_id:
      filters?.partnershipId === 'all' ? null : filters?.partnershipId,
  })
  return { data, error }
}

export async function getPartnershipPerformance(
  startDate: Date,
  endDate: Date,
  filters?: KpiFilters,
) {
  const { data, error } = await supabase.rpc('get_partnership_performance', {
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
    p_professional_id:
      filters?.professionalId === 'all' ? null : filters?.professionalId,
    p_service_id: filters?.serviceId === 'all' ? null : filters?.serviceId,
    p_partnership_id:
      filters?.partnershipId === 'all' ? null : filters?.partnershipId,
  })
  return { data, error }
}

export async function getAnnualComparative(filters?: KpiFilters) {
  const { data, error } = await supabase.rpc('get_annual_comparative', {
    p_professional_id:
      filters?.professionalId === 'all' ? null : filters?.professionalId,
    p_service_id: filters?.serviceId === 'all' ? null : filters?.serviceId,
    p_partnership_id:
      filters?.partnershipId === 'all' ? null : filters?.partnershipId,
  })
  return { data, error }
}

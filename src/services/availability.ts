import { supabase } from '@/lib/supabase/client'
import { RecurringAvailability, AvailabilityOverride } from '@/types'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function getRecurringAvailability(
  professionalId: string,
): Promise<{
  data: RecurringAvailability[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('professional_recurring_availability')
    .select('*')
    .eq('professional_id', professionalId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  return { data, error }
}

export async function getAvailabilityOverrides(
  professionalId: string,
  month: Date,
): Promise<{ data: AvailabilityOverride[] | null; error: any }> {
  const startDate = format(startOfMonth(month), 'yyyy-MM-dd')
  const endDate = format(endOfMonth(month), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('professional_availability_overrides')
    .select('*')
    .eq('professional_id', professionalId)
    .gte('override_date', startDate)
    .lte('override_date', endDate)

  return { data, error }
}

export async function setRecurringAvailability(
  professionalId: string,
  availabilities: Omit<
    RecurringAvailability,
    'id' | 'professional_id' | 'created_at'
  >[],
): Promise<{ error: any }> {
  const { error: deleteError } = await supabase
    .from('professional_recurring_availability')
    .delete()
    .eq('professional_id', professionalId)

  if (deleteError) {
    return { error: deleteError }
  }

  if (availabilities.length > 0) {
    const newAvailabilities = availabilities.map((a) => ({
      ...a,
      professional_id: professionalId,
      service_ids: a.service_ids?.length ? a.service_ids : null,
    }))
    const { error: insertError } = await supabase
      .from('professional_recurring_availability')
      .insert(newAvailabilities)

    return { error: insertError }
  }

  return { error: null }
}

export async function addAvailabilityOverride(
  override: Omit<AvailabilityOverride, 'id' | 'created_at'>,
): Promise<{ data: AvailabilityOverride | null; error: any }> {
  const { data, error } = await supabase
    .from('professional_availability_overrides')
    .insert(override)
    .select()
    .single()
  return { data, error }
}

export async function deleteAvailabilityOverride(
  overrideId: string,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('professional_availability_overrides')
    .delete()
    .eq('id', overrideId)
  return { error }
}

export async function removeDayOverrides(
  professionalId: string,
  date: Date,
): Promise<{ error: any }> {
  const overrideDate = format(date, 'yyyy-MM-dd')
  const { error } = await supabase
    .from('professional_availability_overrides')
    .delete()
    .eq('professional_id', professionalId)
    .eq('override_date', overrideDate)

  return { error }
}

export async function blockDay(
  professionalId: string,
  date: Date,
): Promise<{ error: any }> {
  const overrideDate = format(date, 'yyyy-MM-dd')
  await removeDayOverrides(professionalId, date)

  const { error } = await supabase
    .from('professional_availability_overrides')
    .insert({
      professional_id: professionalId,
      override_date: overrideDate,
      start_time: '00:00:00',
      end_time: '23:59:59',
      is_available: false,
    })

  return { error }
}

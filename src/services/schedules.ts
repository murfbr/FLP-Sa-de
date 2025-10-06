import { supabase } from '@/lib/supabase/client'
import { Schedule } from '@/types'
import { format } from 'date-fns'

// This function remains for simple cases but is now superseded by the filtered one.
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

// New function to handle service-specific availability.
// NOTE: This is a complex client-side query. In a real-world scenario,
// this logic would be best placed in a Supabase Edge Function or RPC for performance.
export async function getFilteredAvailableSchedules(
  professionalId: string,
  serviceId: string,
  date: Date,
): Promise<{ data: Schedule[] | null; error: any }> {
  const dayOfWeek = date.getDay()
  const overrideDate = format(date, 'yyyy-MM-dd')

  // 1. Fetch all unbooked schedules for the day
  const { data: schedules, error: schedulesError } =
    await getAvailableSchedules(professionalId, date)
  if (schedulesError) return { data: null, error: schedulesError }
  if (!schedules || schedules.length === 0) return { data: [], error: null }

  // 2. Fetch availability rules
  const [recurringRes, overrideRes] = await Promise.all([
    supabase
      .from('professional_recurring_availability')
      .select('start_time, end_time, service_ids')
      .eq('professional_id', professionalId)
      .eq('day_of_week', dayOfWeek),
    supabase
      .from('professional_availability_overrides')
      .select('start_time, end_time, service_ids, is_available')
      .eq('professional_id', professionalId)
      .eq('override_date', overrideDate),
  ])

  if (recurringRes.error || overrideRes.error) {
    return { data: null, error: recurringRes.error || overrideRes.error }
  }

  const recurringSlots = recurringRes.data || []
  const overrideSlots = overrideRes.data || []

  const availableSchedules = schedules.filter((schedule) => {
    const scheduleTime = format(new Date(schedule.start_time), 'HH:mm:ss')

    // Check overrides first
    const matchingOverride = overrideSlots.find(
      (o) => scheduleTime >= o.start_time && scheduleTime < o.end_time,
    )

    if (matchingOverride) {
      if (!matchingOverride.is_available) return false // Blocked by override
      // Available by override: check service
      return (
        !matchingOverride.service_ids ||
        matchingOverride.service_ids.length === 0 ||
        matchingOverride.service_ids.includes(serviceId)
      )
    }

    // Check recurring availability
    const matchingRecurring = recurringSlots.find(
      (r) => scheduleTime >= r.start_time && scheduleTime < r.end_time,
    )

    if (matchingRecurring) {
      // Available by recurring: check service
      return (
        !matchingRecurring.service_ids ||
        matchingRecurring.service_ids.length === 0 ||
        matchingRecurring.service_ids.includes(serviceId)
      )
    }

    return false // Not in any available slot
  })

  return { data: availableSchedules, error: null }
}

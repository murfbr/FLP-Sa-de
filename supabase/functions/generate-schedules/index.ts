import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseAdminClient } from '../_shared/supabase-client.ts'
import {
  add,
  eachDayOfInterval,
  format,
  parse,
  startOfDay,
  endOfMonth,
  isBefore,
  startOfMonth,
  max,
} from 'https://esm.sh/date-fns@3.6.0'

// --- Type Definitions ---
interface Professional {
  id: string
  name: string
}

interface RecurringAvailability {
  day_of_week: number
  start_time: string // "HH:mm:ss"
  end_time: string // "HH:mm:ss"
}

interface AvailabilityOverride {
  override_date: string // "yyyy-MM-dd"
  start_time: string // "HH:mm:ss"
  end_time: string // "HH:mm:ss"
  is_available: boolean
}

interface Schedule {
  professional_id: string
  start_time: string // ISO string
  end_time: string // ISO string
}

// --- Constants ---
const MONTHS_TO_GENERATE = 12 // User story requires 1 year
const SLOT_DURATION_MINUTES = 30

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const today = startOfDay(new Date())
    // Ensure we cover at least 1 year from today
    const targetEndDate = add(today, { months: MONTHS_TO_GENERATE })

    // 1. Fetch all professionals
    const { data: professionals, error: professionalsError } =
      await supabaseAdmin.from('professionals').select('id, name')

    if (professionalsError) throw professionalsError

    const logs: string[] = []

    // 2. Process each professional
    for (const professional of professionals as Professional[]) {
      logs.push(`Processing professional: ${professional.name}`)

      // Fetch availability rules ONCE for the whole period to avoid repeated DB calls
      const [recurringRes, overridesRes] = await Promise.all([
        supabaseAdmin
          .from('professional_recurring_availability')
          .select('day_of_week, start_time, end_time')
          .eq('professional_id', professional.id),
        supabaseAdmin
          .from('professional_availability_overrides')
          .select('override_date, start_time, end_time, is_available')
          .eq('professional_id', professional.id)
          .gte('override_date', format(today, 'yyyy-MM-dd'))
          .lte('override_date', format(targetEndDate, 'yyyy-MM-dd')),
      ])

      if (recurringRes.error) throw recurringRes.error
      if (overridesRes.error) throw overridesRes.error

      const recurringAvailability = (recurringRes.data ||
        []) as RecurringAvailability[]
      const overrides = (overridesRes.data || []) as AvailabilityOverride[]
      const overridesMap = new Map<string, AvailabilityOverride[]>()
      overrides.forEach((override) => {
        const dateKey = override.override_date
        if (!overridesMap.has(dateKey)) overridesMap.set(dateKey, [])
        overridesMap.get(dateKey)!.push(override)
      })

      // Iterate Month by Month to manage batch size
      let currentMonthStart = startOfMonth(today)

      while (isBefore(currentMonthStart, targetEndDate)) {
        const currentMonthEnd = endOfMonth(currentMonthStart)

        const newSchedules: Schedule[] = []
        const daysToProcess = eachDayOfInterval({
          start: max([today, currentMonthStart]), // Don't generate for past days in the current month
          end: currentMonthEnd,
        })

        for (const day of daysToProcess) {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayOfWeek = day.getDay()
          const dayOverrides = overridesMap.get(dateStr) || []
          const negativeOverrides = dayOverrides.filter((o) => !o.is_available)
          const positiveOverrides = dayOverrides.filter((o) => o.is_available)

          const potentialSlots: Date[] = []

          // Helper to add slots from a range
          const addSlotsFromRange = (start: Date, end: Date) => {
            let s = start
            while (isBefore(s, end)) {
              const e = add(s, { minutes: SLOT_DURATION_MINUTES })
              if (!isBefore(end, e)) {
                // Check blocking
                const isBlocked = negativeOverrides.some((o) => {
                  const oStart = parse(o.start_time, 'HH:mm:ss', day)
                  const oEnd = parse(o.end_time, 'HH:mm:ss', day)
                  // Check if slot overlaps with blocking override
                  return isBefore(s, oEnd) && isBefore(oStart, e)
                })

                if (!isBlocked) {
                  potentialSlots.push(s)
                }
              }
              s = e
            }
          }

          // From Recurring
          recurringAvailability
            .filter((r) => r.day_of_week === dayOfWeek)
            .forEach((r) => {
              addSlotsFromRange(
                parse(r.start_time, 'HH:mm:ss', day),
                parse(r.end_time, 'HH:mm:ss', day),
              )
            })

          // From Positive Overrides
          positiveOverrides.forEach((o) => {
            addSlotsFromRange(
              parse(o.start_time, 'HH:mm:ss', day),
              parse(o.end_time, 'HH:mm:ss', day),
            )
          })

          // Deduplicate and push
          const uniqueSlots = new Set(
            potentialSlots.map((d) => d.toISOString()),
          )
          uniqueSlots.forEach((timeIso) => {
            const start = new Date(timeIso)
            const end = add(start, { minutes: SLOT_DURATION_MINUTES })
            newSchedules.push({
              professional_id: professional.id,
              start_time: timeIso,
              end_time: end.toISOString(),
            })
          })
        }

        if (newSchedules.length > 0) {
          const { error: upsertError } = await supabaseAdmin
            .from('schedules')
            .upsert(newSchedules, {
              onConflict: 'professional_id, start_time',
            })

          if (upsertError) throw upsertError
          logs.push(
            `Generated/Upserted ${newSchedules.length} slots for ${professional.name} in ${format(currentMonthStart, 'MMM yyyy')}`,
          )
        }

        currentMonthStart = add(currentMonthStart, { months: 1 })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schedule generation completed successfully.',
        logs,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in schedule generation function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

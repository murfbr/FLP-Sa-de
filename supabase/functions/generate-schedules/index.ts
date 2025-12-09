import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseAdminClient } from '../_shared/supabase-client.ts'
import {
  add,
  eachDayOfInterval,
  format,
  parse,
  startOfDay,
  max,
  isBefore,
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
const LOOK_AHEAD_MONTHS = 18
const SLOT_DURATION_MINUTES = 30

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const today = startOfDay(new Date())
    const lookAheadEndDate = add(today, { months: LOOK_AHEAD_MONTHS })
    const finalEndDate = max([
      lookAheadEndDate,
      new Date('2026-12-31T23:59:59Z'),
    ])

    // 1. Fetch all professionals
    const { data: professionals, error: professionalsError } =
      await supabaseAdmin.from('professionals').select('id, name')

    if (professionalsError) throw professionalsError

    const logs: string[] = []

    // 2. Process each professional
    for (const professional of professionals as Professional[]) {
      // 3. Determine date range for generation
      const { data: lastSchedule, error: lastScheduleError } =
        await supabaseAdmin
          .from('schedules')
          .select('start_time')
          .eq('professional_id', professional.id)
          .order('start_time', { ascending: false })
          .limit(1)
          .single()

      if (lastScheduleError && lastScheduleError.code !== 'PGRST116') {
        throw lastScheduleError
      }

      const startDate = lastSchedule
        ? startOfDay(new Date(lastSchedule.start_time))
        : today

      if (!isBefore(startDate, finalEndDate)) {
        logs.push(
          `Professional ${professional.name} (${professional.id}) is already scheduled up to date. Skipping.`,
        )
        continue
      }

      const processingEndDate = add(startDate, { months: 1 }) // Process one month at a time to avoid timeouts
      const generationEndDate = isBefore(processingEndDate, finalEndDate)
        ? processingEndDate
        : finalEndDate

      // 4. Fetch availability rules for the professional
      const [recurringRes, overridesRes] = await Promise.all([
        supabaseAdmin
          .from('professional_recurring_availability')
          .select('day_of_week, start_time, end_time')
          .eq('professional_id', professional.id),
        supabaseAdmin
          .from('professional_availability_overrides')
          .select('override_date, start_time, end_time, is_available')
          .eq('professional_id', professional.id)
          .gte('override_date', format(startDate, 'yyyy-MM-dd'))
          .lte('override_date', format(generationEndDate, 'yyyy-MM-dd')),
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

      const newSchedules: Schedule[] = []
      const daysToProcess = eachDayOfInterval({
        start: startDate,
        end: generationEndDate,
      })

      // 5. Iterate through each day and generate slots
      for (const day of daysToProcess) {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayOfWeek = day.getDay()
        const dayOverrides = overridesMap.get(dateStr) || []

        const availableBlocks: { start: Date; end: Date }[] = []

        // Overrides take precedence
        dayOverrides
          .filter((o) => o.is_available)
          .forEach((o) => {
            availableBlocks.push({
              start: parse(o.start_time, 'HH:mm:ss', day),
              end: parse(o.end_time, 'HH:mm:ss', day),
            })
          })

        // If no overrides, or to fill gaps between overrides, check recurring
        const recurringForDay = recurringAvailability.filter(
          (r) => r.day_of_week === dayOfWeek,
        )
        recurringForDay.forEach((r) => {
          const blockStart = parse(r.start_time, 'HH:mm:ss', day)
          const blockEnd = parse(r.end_time, 'HH:mm:ss', day)

          // Check if this recurring block is blocked by an override
          const isBlocked = dayOverrides.some(
            (o) =>
              !o.is_available &&
              isBefore(blockStart, parse(o.end_time, 'HH:mm:ss', day)) &&
              isBefore(parse(o.start_time, 'HH:mm:ss', day), blockEnd),
          )

          if (!isBlocked) {
            availableBlocks.push({ start: blockStart, end: blockEnd })
          }
        })

        // 6. Create slots from available blocks
        for (const block of availableBlocks) {
          let currentTime = block.start
          while (isBefore(currentTime, block.end)) {
            const slotEnd = add(currentTime, { minutes: SLOT_DURATION_MINUTES })
            if (!isBefore(block.end, slotEnd)) {
              newSchedules.push({
                professional_id: professional.id,
                start_time: currentTime.toISOString(),
                end_time: slotEnd.toISOString(),
                // Removed is_booked property
              })
            }
            currentTime = slotEnd
          }
        }
      }

      // 7. Batch upsert new schedules
      if (newSchedules.length > 0) {
        // Upsert schedules without is_booked
        const { error: upsertError } = await supabaseAdmin
          .from('schedules')
          .upsert(newSchedules, {
            onConflict: 'professional_id, start_time',
          })

        if (upsertError) throw upsertError
        logs.push(
          `Upserted ${newSchedules.length} schedules for professional ${professional.name}.`,
        )
      } else {
        logs.push(
          `No new schedules to generate for professional ${professional.name}.`,
        )
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

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
  addDays,
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
const MONTHS_TO_GENERATE = 12
const SLOT_DURATION_MINUTES = 30

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const logs: string[] = []
  const log = (msg: string) => {
    console.log(msg)
    logs.push(msg)
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const today = startOfDay(new Date())
    // Ensure we cover 12 months from today
    const targetEndDate = add(today, { months: MONTHS_TO_GENERATE })

    log(
      `Starting schedule generation from ${format(today, 'yyyy-MM-dd')} to ${format(targetEndDate, 'yyyy-MM-dd')}`,
    )

    // 1. Fetch all professionals
    const { data: professionals, error: professionalsError } =
      await supabaseAdmin.from('professionals').select('id, name')

    if (professionalsError) throw professionalsError

    // 2. Process each professional
    for (const professional of professionals as Professional[]) {
      log(`Processing professional: ${professional.name} (${professional.id})`)

      // Fetch availability rules
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

      log(
        `Found ${recurringAvailability.length} recurring rules and ${overrides.length} overrides.`,
      )

      // --- CALCULATE EXPECTED SLOTS ---
      const expectedSlots = new Set<string>() // Set of ISO start times
      const expectedSlotsList: Schedule[] = []

      const daysToProcess = eachDayOfInterval({
        start: today,
        end: targetEndDate,
      })

      for (const day of daysToProcess) {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayOfWeek = day.getDay()
        const dayOverrides = overridesMap.get(dateStr) || []

        // Strategy:
        // 1. If positive overrides exist, ONLY use them (they completely replace recurring for that day/time range logic is complex,
        //    but typically overrides are specific. Simplest interpretation: Positive overrides ADD to availability,
        //    or replace day?
        //    Requirement: "Overrides (specific date... availability status)".
        //    Common logic: If there are Positive Overrides, use ONLY them for that day? Or merge?
        //    Let's assume: If there is ANY override for a day, we look at the overrides.
        //    Actually, "Negative" overrides block recurring. "Positive" overrides add availability.
        //    Let's stick to the previous logic: Recurring + Positive Overrides - Negative Overrides.

        const negativeOverrides = dayOverrides.filter((o) => !o.is_available)
        const positiveOverrides = dayOverrides.filter((o) => o.is_available)

        const potentialSlots: Date[] = []

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

        // Add from Recurring
        recurringAvailability
          .filter((r) => r.day_of_week === dayOfWeek)
          .forEach((r) => {
            addSlotsFromRange(
              parse(r.start_time, 'HH:mm:ss', day),
              parse(r.end_time, 'HH:mm:ss', day),
            )
          })

        // Add from Positive Overrides
        positiveOverrides.forEach((o) => {
          addSlotsFromRange(
            parse(o.start_time, 'HH:mm:ss', day),
            parse(o.end_time, 'HH:mm:ss', day),
          )
        })

        // Add to expected list
        potentialSlots.forEach((s) => {
          expectedSlots.add(s.toISOString())
          expectedSlotsList.push({
            professional_id: professional.id,
            start_time: s.toISOString(),
            end_time: add(s, { minutes: SLOT_DURATION_MINUTES }).toISOString(),
          })
        })
      }

      log(
        `Calculated ${expectedSlots.size} expected slots for ${professional.name}.`,
      )

      // --- SYNC WITH DB ---
      // We need to remove slots that are in DB but NOT in expectedSlots, UNLESS they are booked.

      // 1. Fetch existing slots for this professional in the range
      // We process in chunks to avoid memory limits if massive, but for 1 pro 1 year (~8k slots) it fits in memory.
      const { data: existingSlots, error: fetchError } = await supabaseAdmin
        .from('schedules')
        .select('id, start_time')
        .eq('professional_id', professional.id)
        .gte('start_time', today.toISOString())
        .lt('start_time', targetEndDate.toISOString())

      if (fetchError) throw fetchError

      const existingSlotMap = new Map<string, string>() // ISO -> ID
      existingSlots.forEach((s: any) => existingSlotMap.set(s.start_time, s.id))

      // 2. Identify Deletions
      const toDeleteIds: string[] = []
      for (const [startTime, id] of existingSlotMap.entries()) {
        if (!expectedSlots.has(startTime)) {
          toDeleteIds.push(id)
        }
      }

      // 3. Safe Delete - Check if booked
      if (toDeleteIds.length > 0) {
        log(
          `Identified ${toDeleteIds.length} slots to potentially delete (obsolete). Checking for appointments...`,
        )

        // Fetch booked schedule IDs from the deletion list
        // Supabase `in` filter has a limit, so batch if necessary.
        // For simplicity, we assume < 1000 items or handle batching.
        const BATCH_SIZE = 1000
        const bookedScheduleIds = new Set<string>()

        for (let i = 0; i < toDeleteIds.length; i += BATCH_SIZE) {
          const batch = toDeleteIds.slice(i, i + BATCH_SIZE)
          const { data: booked, error: bookedError } = await supabaseAdmin
            .from('appointments')
            .select('schedule_id')
            .in('schedule_id', batch)
            .neq('status', 'cancelled') // If cancelled, we can delete the schedule? Maybe safer to keep history?
          // Requirement says "accurately consistent". If booked, it exists.

          if (bookedError) throw bookedError
          booked?.forEach((b: any) => bookedScheduleIds.add(b.schedule_id))
        }

        const safeToDelete = toDeleteIds.filter(
          (id) => !bookedScheduleIds.has(id),
        )

        if (safeToDelete.length > 0) {
          for (let i = 0; i < safeToDelete.length; i += BATCH_SIZE) {
            const batch = safeToDelete.slice(i, i + BATCH_SIZE)
            const { error: delError } = await supabaseAdmin
              .from('schedules')
              .delete()
              .in('id', batch)
            if (delError) throw delError
          }
          log(
            `Deleted ${safeToDelete.length} obsolete unbooked slots. Kept ${toDeleteIds.length - safeToDelete.length} booked slots.`,
          )
        }
      }

      // 4. Identify Insertions
      const toInsert: Schedule[] = []
      expectedSlotsList.forEach((slot) => {
        if (!existingSlotMap.has(slot.start_time)) {
          toInsert.push(slot)
        }
      })

      if (toInsert.length > 0) {
        // Batch insert
        const BATCH_SIZE = 1000
        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
          const batch = toInsert.slice(i, i + BATCH_SIZE)
          const { error: insertError } = await supabaseAdmin
            .from('schedules')
            .insert(batch)
          if (insertError) throw insertError
        }
        log(`Inserted ${toInsert.length} new slots.`)
      } else {
        log('No new slots to insert.')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schedule generation completed successfully with full sync.',
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
      JSON.stringify({ success: false, error: error.message, logs }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

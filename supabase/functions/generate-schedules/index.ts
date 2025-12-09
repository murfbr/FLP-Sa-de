import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseAdminClient } from '../_shared/supabase-client.ts'
import {
  add,
  eachDayOfInterval,
  format,
  startOfDay,
  isBefore,
  addMinutes,
} from 'https://esm.sh/date-fns@3.6.0'
import { fromZonedTime, toZonedTime } from 'https://esm.sh/date-fns-tz@3.1.3'

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
const BATCH_SIZE_SELECT = 50
const BATCH_SIZE_INSERT = 100
const TIMEZONE = 'America/Sao_Paulo'

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
    let professionalId: string | undefined
    try {
      const body = await req.json()
      professionalId = body.professional_id
    } catch (e) {
      log('No body provided or invalid JSON, processing all professionals.')
    }

    const supabaseAdmin = createSupabaseAdminClient()

    // Calculate "today" in Brazil Timezone to ensure correct start date
    const nowUtc = new Date()
    const nowBrazil = toZonedTime(nowUtc, TIMEZONE)
    const todayBrazil = startOfDay(nowBrazil)

    // Ensure we cover 12 months from today
    const targetEndDateBrazil = add(todayBrazil, { months: MONTHS_TO_GENERATE })

    log(
      `Starting schedule generation from ${format(todayBrazil, 'yyyy-MM-dd')} to ${format(targetEndDateBrazil, 'yyyy-MM-dd')} (Brazil Time)`,
    )

    // 1. Fetch professionals
    let query = supabaseAdmin.from('professionals').select('id, name')
    if (professionalId) {
      query = query.eq('id', professionalId)
      log(`Filtering for professional ID: ${professionalId}`)
    }

    const { data: professionals, error: professionalsError } = await query

    if (professionalsError) throw professionalsError

    log(`Found ${professionals?.length || 0} professionals to process.`)

    // 2. Process each professional
    for (const professional of (professionals || []) as Professional[]) {
      try {
        log(
          `Processing professional: ${professional.name} (${professional.id})`,
        )

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
            .gte('override_date', format(todayBrazil, 'yyyy-MM-dd'))
            .lte('override_date', format(targetEndDateBrazil, 'yyyy-MM-dd')),
        ])

        if (recurringRes.error) {
          log(
            `Error fetching recurring availability: ${recurringRes.error.message}`,
          )
          continue
        }
        if (overridesRes.error) {
          log(`Error fetching overrides: ${overridesRes.error.message}`)
          continue
        }

        const recurringAvailability = (recurringRes.data ||
          []) as RecurringAvailability[]
        const overrides = (overridesRes.data || []) as AvailabilityOverride[]
        const overridesMap = new Map<string, AvailabilityOverride[]>()
        overrides.forEach((override) => {
          const dateKey = override.override_date
          if (!overridesMap.has(dateKey)) overridesMap.set(dateKey, [])
          overridesMap.get(dateKey)!.push(override)
        })

        // --- CALCULATE EXPECTED SLOTS ---
        const expectedSlots = new Set<string>() // Set of ISO start times
        const expectedSlotsList: Schedule[] = []

        const daysToProcess = eachDayOfInterval({
          start: todayBrazil,
          end: targetEndDateBrazil,
        })

        for (const day of daysToProcess) {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayOfWeek = day.getDay()
          const dayOverrides = overridesMap.get(dateStr) || []

          const negativeOverrides = dayOverrides.filter((o) => !o.is_available)
          const positiveOverrides = dayOverrides.filter((o) => o.is_available)

          // Helper to create UTC date from Brazil date + Time string
          const createUtcDate = (timeStr: string) => {
            const dateTimeStr = `${dateStr} ${timeStr}`
            return fromZonedTime(dateTimeStr, TIMEZONE)
          }

          const addSlotsFromRange = (
            startTimeStr: string,
            endTimeStr: string,
          ) => {
            let s = createUtcDate(startTimeStr)
            const end = createUtcDate(endTimeStr)

            while (isBefore(s, end)) {
              const e = addMinutes(s, SLOT_DURATION_MINUTES)
              if (!isBefore(end, e)) {
                // Ensure slot fits completely in range
                // Check blocking
                const isBlocked = negativeOverrides.some((o) => {
                  const oStart = createUtcDate(o.start_time)
                  const oEnd = createUtcDate(o.end_time)
                  // Check if slot overlaps with blocking override
                  return isBefore(s, oEnd) && isBefore(oStart, e)
                })

                if (!isBlocked) {
                  const startIso = s.toISOString()
                  const endIso = e.toISOString()

                  // Ensure we don't have duplicates
                  expectedSlots.add(startIso)
                  expectedSlotsList.push({
                    professional_id: professional.id,
                    start_time: startIso,
                    end_time: endIso,
                  })
                }
              }
              s = e
            }
          }

          // Add from Recurring
          recurringAvailability
            .filter((r) => r.day_of_week === dayOfWeek)
            .forEach((r) => {
              addSlotsFromRange(r.start_time, r.end_time)
            })

          // Add from Positive Overrides
          positiveOverrides.forEach((o) => {
            addSlotsFromRange(o.start_time, o.end_time)
          })
        }

        // De-duplicate expected slots based on start_time
        const uniqueExpectedSlots = new Map<string, Schedule>()
        expectedSlotsList.forEach((slot) => {
          uniqueExpectedSlots.set(slot.start_time, slot)
        })

        log(
          `Calculated ${uniqueExpectedSlots.size} unique expected slots for ${professional.name}.`,
        )

        // --- SYNC WITH DB ---
        // Fetch existing slots
        // Note: we fetch based on the UTC range covered by our Brazil date range
        // Start of todayBrazil in UTC
        const utcStartRange = fromZonedTime(
          format(todayBrazil, 'yyyy-MM-dd') + ' 00:00:00',
          TIMEZONE,
        )
        // End of targetEndDateBrazil in UTC
        const utcEndRange = fromZonedTime(
          format(targetEndDateBrazil, 'yyyy-MM-dd') + ' 23:59:59',
          TIMEZONE,
        )

        const { data: existingSlots, error: fetchError } = await supabaseAdmin
          .from('schedules')
          .select('id, start_time')
          .eq('professional_id', professional.id)
          .gte('start_time', utcStartRange.toISOString())
          .lt('start_time', utcEndRange.toISOString())

        if (fetchError) throw fetchError

        const existingSlotMap = new Map<string, string>() // StartTime ISO -> ID
        existingSlots?.forEach((s: any) =>
          existingSlotMap.set(s.start_time, s.id),
        )

        // Identify Deletions
        const toDeleteIds: string[] = []
        for (const [startTime, id] of existingSlotMap.entries()) {
          if (!uniqueExpectedSlots.has(startTime)) {
            toDeleteIds.push(id)
          }
        }

        // Identify Insertions
        const toInsert: Schedule[] = []
        for (const [startTime, slot] of uniqueExpectedSlots.entries()) {
          if (!existingSlotMap.has(startTime)) {
            toInsert.push(slot)
          }
        }

        // Process Deletions safely (check for bookings)
        if (toDeleteIds.length > 0) {
          log(`Found ${toDeleteIds.length} slots to potentially delete.`)

          // Batch process deletions
          for (let i = 0; i < toDeleteIds.length; i += BATCH_SIZE_SELECT) {
            const batchIds = toDeleteIds.slice(i, i + BATCH_SIZE_SELECT)

            // Check which ones are booked
            const { data: booked, error: bookedError } = await supabaseAdmin
              .from('appointments')
              .select('schedule_id')
              .in('schedule_id', batchIds)
              .neq('status', 'cancelled')

            if (bookedError) {
              log(`Error checking booked slots: ${bookedError.message}`)
              continue
            }

            const bookedIds = new Set(
              booked?.map((b: any) => b.schedule_id) || [],
            )
            const safeToDelete = batchIds.filter((id) => !bookedIds.has(id))

            if (safeToDelete.length > 0) {
              const { error: delError } = await supabaseAdmin
                .from('schedules')
                .delete()
                .in('id', safeToDelete)

              if (delError) {
                log(`Error deleting slots: ${delError.message}`)
              } else {
                log(`Deleted ${safeToDelete.length} slots in batch.`)
              }
            }
          }
        }

        // Process Insertions
        if (toInsert.length > 0) {
          for (let i = 0; i < toInsert.length; i += BATCH_SIZE_INSERT) {
            const batch = toInsert.slice(i, i + BATCH_SIZE_INSERT)
            // Use upsert with ignoreDuplicates
            const { error: insertError } = await supabaseAdmin
              .from('schedules')
              .upsert(batch, {
                onConflict: 'professional_id, start_time',
                ignoreDuplicates: true,
              })

            if (insertError) {
              log(`Error inserting slots: ${insertError.message}`)
            } else {
              log(`Inserted/Upserted ${batch.length} slots in batch.`)
            }
          }
        }

        log(`Finished processing ${professional.name}.`)
      } catch (err) {
        log(
          `Error processing professional ${professional.name}: ${err.message}`,
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schedule generation completed.',
        logs,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Fatal error in schedule generation:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message, logs }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

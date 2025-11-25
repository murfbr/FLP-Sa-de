import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  format,
  isSameDay,
  isToday,
  addHours,
  startOfDay,
  parse,
  isBefore,
  isAfter,
  isEqual,
  isValid,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Appointment,
  RecurringAvailability,
  AvailabilityOverride,
} from '@/types'
import { getAppointmentsByProfessionalForRange } from '@/services/appointments'
import {
  getRecurringAvailability,
  getAvailabilityOverridesForRange,
} from '@/services/availability'
import { AppointmentNotesDialog } from '../admin/AppointmentNotesDialog'

interface WeeklyAgendaViewProps {
  professionalId: string
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 06:00 to 21:00

export const WeeklyAgendaView = ({ professionalId }: WeeklyAgendaViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [recurring, setRecurring] = useState<RecurringAvailability[]>([])
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)

  const weekStart = startOfWeek(currentDate, { locale: ptBR })
  const weekEnd = endOfWeek(currentDate, { locale: ptBR })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const startStr = weekStart.toISOString()
    const endStr = weekEnd.toISOString()

    const [apptRes, recurringRes, overridesRes] = await Promise.all([
      getAppointmentsByProfessionalForRange(professionalId, startStr, endStr),
      getRecurringAvailability(professionalId),
      getAvailabilityOverridesForRange(professionalId, weekStart, weekEnd),
    ])

    setAppointments(apptRes.data || [])
    setRecurring(recurringRes.data || [])
    setOverrides(overridesRes.data || [])
    setIsLoading(false)
  }, [professionalId, weekStart, weekEnd])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1))
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const isSlotAvailable = (day: Date, hour: number) => {
    const slotStart = addHours(startOfDay(day), hour)
    const slotEnd = addHours(slotStart, 1)
    const dayOfWeek = day.getDay()
    const dateStr = format(day, 'yyyy-MM-dd')

    // Check overrides first
    const dayOverrides = overrides.filter((o) => o.override_date === dateStr)

    // If there are overrides, they dictate availability
    if (dayOverrides.length > 0) {
      // Check if any override blocks this slot
      const isBlocked = dayOverrides.some((o) => {
        if (o.is_available) return false
        const oStart = parse(o.start_time, 'HH:mm:ss', day)
        const oEnd = parse(o.end_time, 'HH:mm:ss', day)
        // Block if override overlaps with slot
        return (
          (isBefore(oStart, slotEnd) && isAfter(oEnd, slotStart)) ||
          isEqual(oStart, slotStart)
        )
      })

      if (isBlocked) return false

      // Check if any override enables this slot
      const isEnabled = dayOverrides.some((o) => {
        if (!o.is_available) return false
        const oStart = parse(o.start_time, 'HH:mm:ss', day)
        const oEnd = parse(o.end_time, 'HH:mm:ss', day)
        // Enable if override covers the slot (or at least overlaps significantly)
        // For simplicity, we check overlap
        return (
          (isBefore(oStart, slotEnd) && isAfter(oEnd, slotStart)) ||
          isEqual(oStart, slotStart)
        )
      })

      if (isEnabled) return true

      // If overrides exist but none explicitly block or enable this specific slot,
      // we need to decide if "presence of overrides" implies "only these overrides apply"
      // or "overrides modify recurring".
      // Based on typical logic: "Overrides take precedence".
      // Usually if I say "I am available 10-12 on this specific date", it implies "ONLY 10-12".
      // But if I say "I am NOT available 10-12", it implies "Everything else is normal".

      // Let's stick to: Positive overrides replace recurring. Negative overrides subtract from recurring.
      const hasPositiveOverride = dayOverrides.some((o) => o.is_available)
      if (hasPositiveOverride) return false // If positive overrides exist and didn't cover this slot, it's unavailable.
    }

    // Check recurring
    const dayRecurring = recurring.filter((r) => r.day_of_week === dayOfWeek)
    const isRecurringAvailable = dayRecurring.some((r) => {
      const rStart = parse(r.start_time, 'HH:mm:ss', day)
      const rEnd = parse(r.end_time, 'HH:mm:ss', day)
      return (
        (isBefore(rStart, slotEnd) && isAfter(rEnd, slotStart)) ||
        isEqual(rStart, slotStart)
      )
    })

    // If we had negative overrides but no positive ones, we fall back to recurring
    // But we already checked for blocking overrides above.
    return isRecurringAvailable
  }

  const getAppointmentForSlot = (day: Date, hour: number) => {
    const slotStart = addHours(startOfDay(day), hour)
    const slotEnd = addHours(slotStart, 1)

    return appointments.find((appt) => {
      if (!appt.schedules?.start_time) return false
      const apptStart = new Date(appt.schedules.start_time)
      return (
        isSameDay(apptStart, day) &&
        (isEqual(apptStart, slotStart) ||
          (isAfter(apptStart, slotStart) && isBefore(apptStart, slotEnd)))
      )
    })
  }

  const handleAppointmentClick = (appt: Appointment) => {
    setSelectedAppointment(appt)
    setIsNotesDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize ml-2">
            {format(weekStart, "d 'de' MMM", { locale: ptBR })} -{' '}
            {format(weekEnd, "d 'de' MMM, yyyy", { locale: ptBR })}
          </h2>
        </div>
        <Button variant="outline" onClick={goToToday}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          Hoje
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
                <div className="p-2 border-r bg-muted/30"></div>
                {days.map((day) => (
                  <div
                    key={day.toString()}
                    className={cn(
                      'p-2 text-center border-r last:border-r-0',
                      isToday(day) && 'bg-primary/10',
                    )}
                  >
                    <div className="text-xs text-muted-foreground capitalize">
                      {format(day, 'EEE', { locale: ptBR })}
                    </div>
                    <div
                      className={cn(
                        'text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full',
                        isToday(day) && 'bg-primary text-primary-foreground',
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Body */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                {HOURS.map((hour) => (
                  <>
                    {/* Time Label */}
                    <div className="p-2 text-xs text-muted-foreground text-right border-r border-b bg-muted/30 h-20">
                      {`${hour.toString().padStart(2, '0')}:00`}
                    </div>

                    {/* Days */}
                    {days.map((day) => {
                      const isAvailable = isSlotAvailable(day, hour)
                      const appointment = getAppointmentForSlot(day, hour)

                      return (
                        <div
                          key={`${day}-${hour}`}
                          className={cn(
                            'border-r border-b last:border-r-0 h-20 relative p-1 transition-colors',
                            !isAvailable && 'bg-muted/30 diagonal-stripes',
                            isAvailable && 'bg-background',
                          )}
                        >
                          {appointment && (
                            <div
                              onClick={() =>
                                handleAppointmentClick(appointment)
                              }
                              className={cn(
                                'absolute inset-1 rounded-md p-1.5 text-xs cursor-pointer hover:opacity-90 shadow-sm overflow-hidden flex flex-col gap-0.5',
                                appointment.status === 'completed'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : appointment.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : 'bg-primary/15 text-primary border-primary/20 border',
                              )}
                            >
                              <div className="font-semibold truncate">
                                {appointment.clients.name}
                              </div>
                              <div className="truncate opacity-80">
                                {appointment.services.name}
                              </div>
                              <div className="mt-auto text-[10px] font-mono opacity-70">
                                {format(
                                  new Date(appointment.schedules.start_time),
                                  'HH:mm',
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AppointmentNotesDialog
        appointment={selectedAppointment}
        isOpen={isNotesDialogOpen}
        onOpenChange={setIsNotesDialogOpen}
        onNoteSave={fetchData}
      />

      <style>{`
        .diagonal-stripes {
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0, 0, 0, 0.03) 10px,
            rgba(0, 0, 0, 0.03) 20px
          );
        }
      `}</style>
    </div>
  )
}

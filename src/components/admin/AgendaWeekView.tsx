import { useState, useEffect, useMemo } from 'react'
import {
  addWeeks,
  subWeeks,
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getAppointmentsForRange } from '@/services/appointments'
import { Appointment } from '@/types'
import { cn, formatInTimeZone } from '@/lib/utils'
import { ViewMode } from './AgendaView'
import { computeEventLayout } from '@/lib/event-layout'

interface AgendaWeekViewProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onViewChange: (view: ViewMode) => void
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick: (date: Date, isSpecificSlot?: boolean) => void
  selectedProfessional: string
}

// Timeline helpers
const START_HOUR = 0
const END_HOUR = 24
const COMPACT_START = 7
const COMPACT_END = 21
const NORMAL_HEIGHT = 64
const COMPACT_HEIGHT = 24

const getHourHeight = (hour: number) => {
  if (hour < COMPACT_START || hour >= COMPACT_END) return COMPACT_HEIGHT
  return NORMAL_HEIGHT
}

const getTopOffset = (time: Date) => {
  const timeStr = formatInTimeZone(time, 'HH:mm')
  const [h, m] = timeStr.split(':').map(Number)

  let offset = 0
  for (let i = 0; i < h; i++) {
    offset += getHourHeight(i)
  }
  offset += (m / 60) * getHourHeight(h)
  return offset
}

const getDurationHeight = (startTime: Date, durationMinutes: number) => {
  const startStr = formatInTimeZone(startTime, 'HH:mm')
  let [h, m] = startStr.split(':').map(Number)

  let height = 0
  let remaining = durationMinutes

  while (remaining > 0) {
    const minutesLeftInHour = 60 - m
    const chunk = Math.min(remaining, minutesLeftInHour)
    height += (chunk / 60) * getHourHeight(h)
    remaining -= chunk
    h = (h + 1) % 24
    m = 0
  }

  return height
}

export const AgendaWeekView = ({
  currentDate,
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
  selectedProfessional,
}: AgendaWeekViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const start = startOfWeek(currentDate, { locale: ptBR })
      const end = endOfWeek(currentDate, { locale: ptBR })

      const { data } = await getAppointmentsForRange(
        start,
        end,
        selectedProfessional,
      )
      setAppointments(data || [])
      setIsLoading(false)
    }
    fetchData()
  }, [selectedProfessional, currentDate])

  const daysInWeek = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: ptBR })
    const end = endOfWeek(currentDate, { locale: ptBR })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeEventLayout>>()

    // Group raw appointments first
    const rawMap = new Map<string, Appointment[]>()

    appointments.forEach((appt) => {
      if (!appt.schedules?.start_time) return
      const day = formatInTimeZone(appt.schedules.start_time, 'yyyy-MM-dd')
      if (!rawMap.has(day)) rawMap.set(day, [])
      rawMap.get(day)?.push(appt)
    })

    // Then compute layout for each day
    rawMap.forEach((appts, day) => {
      map.set(day, computeEventLayout(appts, getTopOffset, getDurationHeight))
    })

    return map
  }, [appointments])

  const nextWeek = () => onDateChange(addWeeks(currentDate, 1))
  const prevWeek = () => onDateChange(subWeeks(currentDate, 1))

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => i + START_HOUR,
  )

  return (
    <div className="p-4 border rounded-lg flex flex-col h-[800px]">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <Button variant="outline" size="icon" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg md:text-xl font-semibold capitalize text-center">
          {format(startOfWeek(currentDate, { locale: ptBR }), 'dd MMM')} -{' '}
          {format(endOfWeek(currentDate, { locale: ptBR }), 'dd MMM yyyy', {
            locale: ptBR,
          })}
        </h2>
        <Button variant="outline" size="icon" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="flex-1 w-full" />
      ) : (
        <div className="flex-1 overflow-y-auto relative border rounded-md">
          <div className="min-w-[800px] relative">
            {/* Header Row */}
            <div className="sticky top-0 z-20 flex border-b bg-background">
              <div className="w-16 shrink-0 border-r bg-muted/30"></div>
              {daysInWeek.map((day) => (
                <div
                  key={day.toString()}
                  className={cn(
                    'flex-1 text-center py-2 border-r last:border-0',
                    isToday(day) && 'bg-primary/5',
                  )}
                >
                  <p className="text-xs uppercase text-muted-foreground">
                    {format(day, 'EEE', { locale: ptBR })}
                  </p>
                  <p
                    className={cn(
                      'text-lg font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full',
                      isToday(day) && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="flex relative">
              {/* Time Column */}
              <div className="w-16 shrink-0 border-r bg-muted/10">
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: getHourHeight(h) }}
                    className="border-b text-[10px] text-muted-foreground text-right pr-2 pt-1 relative"
                  >
                    <span className="-top-2 relative">{h}:00</span>
                  </div>
                ))}
              </div>

              {/* Columns per day */}
              {daysInWeek.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const dayAppts = appointmentsByDay.get(dayKey) || []

                return (
                  <div
                    key={day.toString()}
                    className="flex-1 border-r last:border-0 relative bg-background"
                  >
                    {/* Grid Lines & Hover Actions */}
                    {hours.map((h) => (
                      <div
                        key={h}
                        style={{ height: getHourHeight(h) }}
                        className="border-b group relative hover:bg-muted/30 transition-colors"
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 rounded-full pointer-events-auto shadow-sm"
                            onClick={() => {
                              const targetTime = new Date(day)
                              targetTime.setHours(h, 0, 0, 0)
                              onTimeSlotClick(targetTime, true)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Appointments Layer */}
                    {dayAppts.map((appt) => {
                      const { top, height, left, width } = appt.layout

                      return (
                        <div
                          key={appt.id}
                          style={{
                            top: top,
                            height: height,
                            left: `${left}%`,
                            width: `${width}%`,
                            position: 'absolute',
                            padding: '1px',
                          }}
                          className="z-10"
                        >
                          <div
                            className={cn(
                              'h-full w-full rounded p-1 text-xs cursor-pointer shadow-sm overflow-hidden border transition-transform hover:scale-[1.02] hover:z-20',
                              appt.status === 'completed'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : appt.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800 border-red-200'
                                  : appt.status === 'no_show'
                                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                                    : 'bg-primary/10 text-primary border-primary/20',
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onAppointmentClick(appt)
                            }}
                            title={`${appt.clients.name} - ${appt.services.name}`}
                          >
                            <div className="font-semibold truncate leading-none mb-0.5">
                              {appt.clients.name} - {appt.services.name}
                            </div>
                            <div className="truncate text-[10px] opacity-80 leading-none">
                              {formatInTimeZone(
                                appt.schedules.start_time,
                                'HH:mm',
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

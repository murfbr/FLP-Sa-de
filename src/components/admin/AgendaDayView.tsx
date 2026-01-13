import { useState, useEffect, useMemo } from 'react'
import { addDays, subDays, format, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getAppointmentsForRange } from '@/services/appointments'
import { Appointment } from '@/types'
import { cn, formatInTimeZone } from '@/lib/utils'
import { ViewMode } from './AgendaView'
import { computeEventLayout } from '@/lib/event-layout'

interface AgendaDayViewProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onViewChange: (view: ViewMode) => void
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick: (date: Date, isSpecificSlot?: boolean) => void
  selectedProfessional: string
}

// Timeline constants
const START_HOUR = 0
const END_HOUR = 24
const COMPACT_START = 7
const COMPACT_END = 21
const NORMAL_HEIGHT = 80
const COMPACT_HEIGHT = 30

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

export const AgendaDayView = ({
  currentDate,
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
  selectedProfessional,
}: AgendaDayViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const start = startOfDay(currentDate)
      const end = endOfDay(currentDate)
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

  const dayAppointments = useMemo(() => {
    const filtered = appointments.filter((appt) => {
      if (!appt.schedules?.start_time) return false
      return (
        formatInTimeZone(appt.schedules.start_time, 'yyyy-MM-dd') ===
        format(currentDate, 'yyyy-MM-dd')
      )
    })

    // Apply layout logic for side-by-side overlap
    return computeEventLayout(filtered, getTopOffset, getDurationHeight)
  }, [appointments, currentDate])

  const nextDay = () => onDateChange(addDays(currentDate, 1))
  const prevDay = () => onDateChange(subDays(currentDate, 1))

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => i + START_HOUR,
  )

  return (
    <div className="p-4 border rounded-lg flex flex-col h-[800px]">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <Button variant="outline" size="icon" onClick={prevDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold capitalize">
          {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h2>
        <Button variant="outline" size="icon" onClick={nextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="flex-1 w-full" />
      ) : (
        <div className="flex-1 overflow-y-auto relative border rounded-md">
          <div className="flex relative min-h-full">
            {/* Time Column */}
            <div className="w-20 shrink-0 border-r bg-muted/10 sticky left-0 z-20">
              {hours.map((h) => (
                <div
                  key={h}
                  style={{ height: getHourHeight(h) }}
                  className="border-b text-xs text-muted-foreground text-right pr-3 pt-2 relative"
                >
                  <span className="-top-3 relative">{h}:00</span>
                </div>
              ))}
            </div>

            {/* Day Column */}
            <div className="flex-1 relative bg-background">
              {/* Grid Lines & Hover Actions */}
              {hours.map((h) => (
                <div
                  key={h}
                  style={{ height: getHourHeight(h) }}
                  className="border-b border-dashed group relative hover:bg-muted/30 transition-colors"
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <Button
                      variant="secondary"
                      className="rounded-full shadow-sm pointer-events-auto"
                      onClick={() => {
                        const targetTime = new Date(currentDate)
                        targetTime.setHours(h, 0, 0, 0)
                        onTimeSlotClick(targetTime, true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agendar às {h}:00
                    </Button>
                  </div>
                </div>
              ))}

              {/* Appointments */}
              {dayAppointments.map((appt) => {
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
                      padding: '2px', // Gap
                    }}
                    className="z-10"
                  >
                    <div
                      className={cn(
                        'h-full w-full rounded-md p-2 text-sm cursor-pointer shadow-sm overflow-hidden border transition-all hover:brightness-95 hover:z-20',
                        appt.status === 'completed'
                          ? 'bg-green-100 text-green-900 border-green-200'
                          : appt.status === 'cancelled'
                            ? 'bg-red-100 text-red-900 border-red-200'
                            : appt.status === 'no_show'
                              ? 'bg-orange-100 text-orange-900 border-orange-200'
                              : 'bg-primary/10 text-primary border-primary/20',
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick(appt)
                      }}
                    >
                      <div className="flex justify-between items-start font-bold">
                        <span className="truncate">
                          {appt.clients.name} - {appt.services.name}
                        </span>
                        <span className="font-mono text-xs opacity-75 shrink-0 ml-1">
                          {formatInTimeZone(appt.schedules.start_time, 'HH:mm')}
                        </span>
                      </div>
                    </div>
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

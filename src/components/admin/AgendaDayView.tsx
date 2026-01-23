import { useState, useEffect, useMemo } from 'react'
import {
  addDays,
  subDays,
  format,
  startOfDay,
  endOfDay,
  setMinutes,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getAppointmentsForRange } from '@/services/appointments'
import { Appointment } from '@/types'
import { cn, formatInTimeZone } from '@/lib/utils'
import { ViewMode } from './AgendaView'
import { computeEventLayout } from '@/lib/event-layout'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
const COMPACT_HEIGHT = 40 // Adjusted for 30min slots visibility

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

const getSlotFromY = (y: number) => {
  let currentY = 0
  for (let h = START_HOUR; h < END_HOUR; h++) {
    const height = getHourHeight(h)
    if (y >= currentY && y < currentY + height) {
      // Calculate if top (0-30) or bottom (30-60)
      const relativeY = y - currentY
      const minutes = relativeY < height / 2 ? 0 : 30
      return { hour: h, minutes }
    }
    currentY += height
  }
  return null
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
  const [hoveredSlot, setHoveredSlot] = useState<{
    hour: number
    minutes: number
  } | null>(null)

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

    return computeEventLayout(filtered, getTopOffset, getDurationHeight)
  }, [appointments, currentDate])

  const nextDay = () => onDateChange(addDays(currentDate, 1))
  const prevDay = () => onDateChange(subDays(currentDate, 1))

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => i + START_HOUR,
  )

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const slot = getSlotFromY(y)

    if (slot) {
      if (
        hoveredSlot?.hour !== slot.hour ||
        hoveredSlot?.minutes !== slot.minutes
      ) {
        setHoveredSlot(slot)
      }
    } else {
      setHoveredSlot(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredSlot(null)
  }

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
        <div className="flex-1 overflow-y-auto relative border rounded-md bg-white">
          <div className="flex relative min-h-full">
            {/* Time Column */}
            <div className="w-20 shrink-0 border-r bg-muted/10 sticky left-0 z-30 bg-background">
              {hours.map((h) => (
                <div
                  key={h}
                  style={{ height: getHourHeight(h) }}
                  className="border-b text-xs text-muted-foreground text-right pr-3 pt-2 relative"
                >
                  <span className="-top-3 relative">{h}:00</span>
                  <span className="absolute top-[50%] right-3 -translate-y-[50%] text-[10px] opacity-30 hidden group-hover:block">
                    :30
                  </span>
                </div>
              ))}
            </div>

            {/* Day Column */}
            <div
              className="flex-1 relative bg-background"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* 1. Background Grid Lines */}
              <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: getHourHeight(h) }}
                    className="border-b border-dashed relative"
                  >
                    {/* 30-min subtle line */}
                    <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-gray-100/50" />
                  </div>
                ))}
              </div>

              {/* 2. Appointments */}
              {dayAppointments.map((appt) => {
                const { top, height, left, width } = appt.layout
                const adjustedWidth =
                  width === 100 ? 'calc(100% - 12px)' : `${width}%`
                const hasMissingNotes =
                  appt.status === 'completed' &&
                  (!appt.notes || appt.notes.length === 0)

                return (
                  <div
                    key={appt.id}
                    style={{
                      top: top,
                      height: height,
                      left: `${left}%`,
                      width: adjustedWidth,
                      position: 'absolute',
                      padding: '2px', // Gap
                    }}
                    className="z-10"
                  >
                    <div
                      className={cn(
                        'h-full w-full rounded-md p-2 text-sm cursor-pointer shadow-sm overflow-hidden border transition-all hover:brightness-95 hover:z-20 relative',
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
                      {hasMissingNotes && (
                        <div className="absolute top-1 right-1">
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Notas pendentes</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                      <div className="flex flex-col h-full">
                        <div className="flex justify-between items-start font-bold pr-4">
                          <span className="truncate">{appt.clients.name}</span>
                          <span className="font-mono text-xs opacity-75 shrink-0 ml-1">
                            {formatInTimeZone(
                              appt.schedules.start_time,
                              'HH:mm',
                            )}
                          </span>
                        </div>
                        <div className="text-xs opacity-90 truncate mt-0.5">
                          {appt.services.name}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* 3. Interaction Layer (Plus Buttons) */}
              {hoveredSlot !== null && (
                <div
                  className="absolute w-full z-20 pointer-events-none"
                  style={{ top: 0, height: '100%' }}
                >
                  {hours.map((h) => {
                    if (h !== hoveredSlot.hour) return null
                    let offset = 0
                    for (let i = START_HOUR; i < h; i++) {
                      offset += getHourHeight(i)
                    }

                    // Adjust offset for minutes
                    if (hoveredSlot.minutes === 30) {
                      offset += getHourHeight(h) / 2
                    }

                    return (
                      <div
                        key={`${h}-${hoveredSlot.minutes}`}
                        style={{
                          top: offset,
                          height: getHourHeight(h) / 2,
                        }}
                        className="absolute w-full flex items-center justify-center bg-black/5"
                      >
                        <Button
                          variant="secondary"
                          className="rounded-full shadow-sm pointer-events-auto animate-in fade-in zoom-in duration-100 h-8"
                          onClick={() => {
                            const targetTime = new Date(currentDate)
                            targetTime.setHours(h, hoveredSlot.minutes, 0, 0)
                            onTimeSlotClick(targetTime, true)
                          }}
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Agendar às {h}:
                          {hoveredSlot.minutes === 0 ? '00' : '30'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

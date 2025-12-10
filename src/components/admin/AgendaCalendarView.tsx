import { useState, useEffect, useMemo } from 'react'
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  isValid,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllAppointments } from '@/services/appointments'
import { Appointment } from '@/types'
import { cn, formatInTimeZone } from '@/lib/utils'
import { ViewMode } from './AgendaView'

interface AgendaCalendarViewProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onViewChange: (view: ViewMode) => void
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick: (date: Date) => void
  selectedProfessional: string
}

export const AgendaCalendarView = ({
  currentDate,
  onDateChange,
  onViewChange,
  onAppointmentClick,
  onTimeSlotClick,
  selectedProfessional,
}: AgendaCalendarViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Use local state for the month being viewed, but sync with currentDate initially if needed
  // However, normally calendar view changes month independently until a date is selected.
  // We'll keep currentDate as the "selected" date but track displayedMonth separately.
  const [displayedMonth, setDisplayedMonth] = useState(currentDate)

  useEffect(() => {
    // When currentDate changes externally (e.g. navigation), update displayedMonth
    setDisplayedMonth(currentDate)
  }, [currentDate])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const { data } = await getAllAppointments(selectedProfessional)
      setAppointments(data || [])
      setIsLoading(false)
    }
    fetchData()
  }, [displayedMonth, selectedProfessional]) // Re-fetch if month changes? Actually fetching ALL appointments is safer for now if we don't have month filtering on backend efficiently exposed for 'all' appointments or just simple. getAllAppointments fetches recent/future usually? No, it fetches all. Optimization might be needed later.

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(displayedMonth)
    const end = endOfMonth(displayedMonth)
    return eachDayOfInterval({ start, end })
  }, [displayedMonth])

  const startingDayIndex = getDay(startOfMonth(displayedMonth))

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    appointments
      .filter(
        (appt) =>
          appt.schedules?.start_time &&
          isValid(new Date(appt.schedules.start_time)),
      )
      .forEach((appt) => {
        // Group using Brazil timezone date
        const day = formatInTimeZone(appt.schedules.start_time, 'yyyy-MM-dd')
        if (!map.has(day)) {
          map.set(day, [])
        }
        map.get(day)?.push(appt)
      })
    return map
  }, [appointments])

  const nextMonth = () => setDisplayedMonth(addMonths(displayedMonth, 1))
  const prevMonth = () => setDisplayedMonth(subMonths(displayedMonth, 1))

  const handleDateClick = (day: Date) => {
    onDateChange(day)
    onViewChange('day')
  }

  const handlePlusClick = (e: React.MouseEvent, day: Date) => {
    e.stopPropagation() // Prevent navigation to day view
    // Set time to something reasonable, e.g. 09:00
    const dateWithTime = new Date(day)
    dateWithTime.setHours(9, 0, 0, 0)
    onTimeSlotClick(dateWithTime)
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg md:text-xl font-semibold capitalize text-center">
          {format(displayedMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-px bg-border min-w-[600px]">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
              <div
                key={i}
                className="text-center font-medium py-2 bg-card text-xs sm:text-sm"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: startingDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-muted/50" />
            ))}
            {daysInMonth.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayAppointments = appointmentsByDay.get(dayKey) || []
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] bg-card relative group hover:bg-muted/10 transition-colors cursor-pointer',
                    !isSameMonth(day, displayedMonth) && 'bg-muted/50',
                  )}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="flex justify-between items-start">
                    <time
                      dateTime={format(day, 'yyyy-MM-dd')}
                      className={cn(
                        'block text-xs sm:text-sm text-center h-6 w-6 rounded-full leading-6',
                        isToday(day) && 'bg-primary text-primary-foreground',
                      )}
                    >
                      {format(day, 'd')}
                    </time>

                    {/* Plus Button - Only visible on hover */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handlePlusClick(e, day)}
                      title="Novo agendamento"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-1 space-y-1 hidden sm:block">
                    {dayAppointments.slice(0, 2).map((appt) => (
                      <div
                        key={appt.id}
                        className="text-xs p-1 bg-secondary text-secondary-foreground rounded truncate cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick(appt)
                        }}
                      >
                        {appt.clients.name}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        + {dayAppointments.length - 2} mais
                      </div>
                    )}
                  </div>
                  {dayAppointments.length > 0 && (
                    <div className="sm:hidden w-2 h-2 rounded-full bg-primary mx-auto mt-1"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

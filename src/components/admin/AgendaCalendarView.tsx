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
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllAppointments } from '@/services/appointments'
import { Appointment } from '@/types'
import { cn } from '@/lib/utils'

interface AgendaCalendarViewProps {
  onAppointmentClick: (appointment: Appointment) => void
}

export const AgendaCalendarView = ({
  onAppointmentClick,
}: AgendaCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const { data } = await getAllAppointments()
      setAppointments(data || [])
      setIsLoading(false)
    }
    fetchData()
  }, [currentMonth])

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const startingDayIndex = getDay(startOfMonth(currentMonth))

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    appointments.forEach((appt) => {
      const day = format(new Date(appt.schedules.start_time), 'yyyy-MM-dd')
      if (!map.has(day)) {
        map.set(day, [])
      }
      map.get(day)?.push(appt)
    })
    return map
  }, [appointments])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <div className="grid grid-cols-7 gap-px bg-border">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="text-center font-medium py-2 bg-card">
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
                  'p-2 min-h-[120px] bg-card',
                  !isSameMonth(day, currentMonth) && 'bg-muted/50',
                )}
              >
                <time
                  dateTime={format(day, 'yyyy-MM-dd')}
                  className={cn(
                    'block text-sm text-center h-6 w-6 rounded-full leading-6',
                    isToday(day) && 'bg-primary text-primary-foreground',
                  )}
                >
                  {format(day, 'd')}
                </time>
                <div className="mt-1 space-y-1">
                  {dayAppointments.slice(0, 2).map((appt) => (
                    <div
                      key={appt.id}
                      className="text-xs p-1 bg-secondary text-secondary-foreground rounded truncate cursor-pointer"
                      onClick={() => onAppointmentClick(appt)}
                    >
                      {appt.clients.name}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      + {dayAppointments.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

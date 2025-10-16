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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllAppointments } from '@/services/appointments'
import { Appointment } from '@/types'
import { cn } from '@/lib/utils'

interface AgendaWeekViewProps {
  onAppointmentClick: (appointment: Appointment) => void
}

export const AgendaWeekView = ({ onAppointmentClick }: AgendaWeekViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
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
  }, [])

  const daysInWeek = useMemo(() => {
    const start = startOfWeek(currentWeek, { locale: ptBR })
    const end = endOfWeek(currentWeek, { locale: ptBR })
    return eachDayOfInterval({ start, end })
  }, [currentWeek])

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    appointments.forEach((appt) => {
      const day = format(new Date(appt.schedules.start_time), 'yyyy-MM-dd')
      if (!map.has(day)) map.set(day, [])
      map.get(day)?.push(appt)
    })
    return map
  }, [appointments])

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1))
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1))

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg md:text-xl font-semibold capitalize text-center">
          {format(startOfWeek(currentWeek, { locale: ptBR }), 'dd MMM')} -{' '}
          {format(endOfWeek(currentWeek, { locale: ptBR }), 'dd MMM yyyy', {
            locale: ptBR,
          })}
        </h2>
        <Button variant="outline" size="icon" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-px bg-border border-t border-l min-w-[700px]">
            {daysInWeek.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayAppointments = appointmentsByDay.get(dayKey) || []
              return (
                <div
                  key={day.toString()}
                  className="bg-card border-b border-r min-h-[200px]"
                >
                  <div
                    className={cn(
                      'p-2 text-center border-b',
                      isToday(day) && 'bg-primary/10',
                    )}
                  >
                    <p className="text-sm capitalize">
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className="font-bold text-lg">{format(day, 'd')}</p>
                  </div>
                  <div className="p-1 space-y-1">
                    {dayAppointments
                      .sort(
                        (a, b) =>
                          new Date(a.schedules.start_time).getTime() -
                          new Date(b.schedules.start_time).getTime(),
                      )
                      .map((appt) => (
                        <div
                          key={appt.id}
                          className="text-xs p-1 bg-secondary text-secondary-foreground rounded truncate cursor-pointer"
                          onClick={() => onAppointmentClick(appt)}
                        >
                          {format(new Date(appt.schedules.start_time), 'HH:mm')}{' '}
                          - {appt.clients.name}
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

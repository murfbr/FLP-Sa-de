import { useState, useEffect, useMemo } from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getAppointmentsByProfessionalForRange } from '@/services/appointments'
import { Appointment } from '@/types'
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '../ui/badge'

interface MonthlyAgendaViewProps {
  professionalId: string
}

export const MonthlyAgendaView = ({
  professionalId,
}: MonthlyAgendaViewProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true)
      const startDate = startOfMonth(currentMonth)
      const endDate = endOfMonth(currentMonth)
      const { data } = await getAppointmentsByProfessionalForRange(
        professionalId,
        startDate.toISOString(),
        endDate.toISOString(),
      )
      setAppointments(data || [])
      setIsLoading(false)
    }
    fetchAppointments()
  }, [professionalId, currentMonth])

  const appointmentsOnSelectedDay = useMemo(() => {
    if (!date) return []
    return appointments.filter((appt) =>
      isSameDay(new Date(appt.schedules.start_time), date),
    )
  }, [appointments, date])

  const appointmentDays = useMemo(() => {
    return appointments.map((appt) => new Date(appt.schedules.start_time))
  }, [appointments])

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border p-3"
            modifiers={{ booked: appointmentDays }}
            modifiersStyles={{
              booked: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: 'hsl(var(--primary))',
              },
            }}
          />
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            Agendamentos para {date ? format(date, 'dd/MM/yyyy') : '...'}
          </CardTitle>
          <CardDescription>
            {appointmentsOnSelectedDay.length} agendamento(s) encontrado(s).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointmentsOnSelectedDay.length > 0 ? (
            appointmentsOnSelectedDay.map((appt) => (
              <div
                key={appt.id}
                className="p-3 border rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{appt.clients.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {appt.services.name}
                  </p>
                </div>
                <Badge variant="secondary">
                  {format(new Date(appt.schedules.start_time), 'HH:mm')}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground pt-8">
              Nenhum agendamento para o dia selecionado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

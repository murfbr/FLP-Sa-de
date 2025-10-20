import { useState, useEffect } from 'react'
import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { getAppointmentsByProfessionalForRange } from '@/services/appointments'
import { Appointment } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '../ui/badge'

interface DailyAgendaViewProps {
  professionalId: string
  date: Date
}

export const DailyAgendaView = ({
  professionalId,
  date,
}: DailyAgendaViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      const { data } = await getAppointmentsByProfessionalForRange(
        professionalId,
        startDate.toISOString(),
        endDate.toISOString(),
      )
      setAppointments(data || [])
      setIsLoading(false)
    }
    fetchData()
  }, [professionalId, date])

  const validAppointments = appointments.filter(
    (appt) =>
      appt.schedules?.start_time &&
      isValid(new Date(appt.schedules.start_time)),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">
          {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : validAppointments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum agendamento para este dia.
          </p>
        ) : (
          <ul className="space-y-3">
            {validAppointments
              .sort(
                (a, b) =>
                  new Date(a.schedules.start_time).getTime() -
                  new Date(b.schedules.start_time).getTime(),
              )
              .map((appt) => (
                <li
                  key={appt.id}
                  className="p-3 border rounded-md flex items-center justify-between"
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
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

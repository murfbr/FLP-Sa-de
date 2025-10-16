import { useState, useEffect } from 'react'
import { addDays, subDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllAppointments } from '@/services/appointments'
import { Appointment } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AgendaDayViewProps {
  onAppointmentClick: (appointment: Appointment) => void
}

export const AgendaDayView = ({ onAppointmentClick }: AgendaDayViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
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

  const dayAppointments = appointments.filter(
    (appt) =>
      new Date(appt.schedules.start_time).toDateString() ===
      currentDate.toDateString(),
  )

  const nextDay = () => setCurrentDate(addDays(currentDate, 1))
  const prevDay = () => setCurrentDate(subDays(currentDate, 1))

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
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
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {dayAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum agendamento para este dia.
              </p>
            ) : (
              <ul className="space-y-3">
                {dayAppointments
                  .sort(
                    (a, b) =>
                      new Date(a.schedules.start_time).getTime() -
                      new Date(b.schedules.start_time).getTime(),
                  )
                  .map((appt) => (
                    <li
                      key={appt.id}
                      className="p-3 border rounded-md flex items-center justify-between cursor-pointer hover:bg-muted/50"
                      onClick={() => onAppointmentClick(appt)}
                    >
                      <div>
                        <p className="font-semibold">{appt.clients.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {appt.services.name} com {appt.professionals.name}
                        </p>
                      </div>
                      <p className="font-mono text-sm">
                        {format(new Date(appt.schedules.start_time), 'HH:mm')}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

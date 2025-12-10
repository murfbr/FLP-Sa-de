import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllAppointments } from '@/services/appointments'
import { Appointment } from '@/types'
import { isValid } from 'date-fns'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { formatInTimeZone } from '@/lib/utils'
import { ViewMode } from './AgendaView'

interface AgendaListViewProps {
  onAppointmentClick: (appointment: Appointment) => void
  selectedProfessional: string
  // Unused props but kept for interface compatibility
  currentDate?: Date
  onDateChange?: (date: Date) => void
  onViewChange?: (view: ViewMode) => void
  onTimeSlotClick?: (date: Date) => void
}

export const AgendaListView = ({
  onAppointmentClick,
  selectedProfessional,
}: AgendaListViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const { data } = await getAllAppointments(selectedProfessional)
      if (data) setAppointments(data)
      setIsLoading(false)
    }
    fetchData()
  }, [selectedProfessional])

  const renderContent = () => {
    const validAppointments = appointments.filter(
      (appt) =>
        appt.schedules?.start_time &&
        isValid(new Date(appt.schedules.start_time)),
    )

    if (isLoading) {
      return <Skeleton className="h-96 w-full" />
    }
    if (validAppointments.length === 0) {
      return (
        <div className="text-center py-16">Nenhum agendamento encontrado.</div>
      )
    }
    if (isMobile) {
      return (
        <div className="space-y-4">
          {validAppointments.map((appt) => (
            <Card
              key={appt.id}
              onClick={() => onAppointmentClick(appt)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <CardHeader>
                <CardTitle className="text-base">{appt.clients.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatInTimeZone(
                    appt.schedules.start_time,
                    "dd/MM/yyyy 'às' HH:mm",
                  )}
                </p>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>Serviço:</strong> {appt.services.name}
                </p>
                <p>
                  <strong>Profissional:</strong> {appt.professionals.name}
                </p>
                <Badge>{appt.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Data e Hora</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validAppointments.map((appt) => (
              <TableRow
                key={appt.id}
                onClick={() => onAppointmentClick(appt)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>{appt.clients.name}</TableCell>
                <TableCell>{appt.professionals.name}</TableCell>
                <TableCell>{appt.services.name}</TableCell>
                <TableCell>
                  {formatInTimeZone(
                    appt.schedules.start_time,
                    "dd/MM/yyyy 'às' HH:mm",
                  )}
                </TableCell>
                <TableCell>
                  <Badge>{appt.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return <div className="space-y-4">{renderContent()}</div>
}

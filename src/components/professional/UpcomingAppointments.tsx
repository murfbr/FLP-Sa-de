import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Appointment } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UpcomingAppointmentsProps {
  appointments: Appointment[]
}

export const UpcomingAppointments = ({
  appointments,
}: UpcomingAppointmentsProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Serviço</TableHead>
          <TableHead>Horário</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              Nenhum agendamento encontrado.
            </TableCell>
          </TableRow>
        )}
        {appointments.map((appt) => (
          <TableRow key={appt.id}>
            <TableCell>
              <div className="font-medium">{appt.clients.name}</div>
              <div className="text-sm text-muted-foreground">
                {appt.clients.email}
              </div>
            </TableCell>
            <TableCell>{appt.services.name}</TableCell>
            <TableCell>
              {format(
                new Date(appt.schedules.start_time),
                "dd/MM/yyyy 'às' HH:mm",
                { locale: ptBR },
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{appt.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

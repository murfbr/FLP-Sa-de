import { useState, useEffect } from 'react'
import { startOfDay, endOfDay, isValid, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { getAppointmentsForRange } from '@/services/appointments'
import { Appointment } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, AlertCircle } from 'lucide-react'
import { cn, formatInTimeZone } from '@/lib/utils'
import { ViewMode } from './AgendaView'
import { DateRange } from 'react-day-picker'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AgendaListViewProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onViewChange: (view: ViewMode) => void
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick: (date: Date, isSpecificSlot?: boolean) => void
  selectedProfessional: string
  dateRange: DateRange | undefined
}

export const AgendaListView = ({
  onAppointmentClick,
  selectedProfessional,
  dateRange,
}: AgendaListViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const start = dateRange?.from
        ? startOfDay(dateRange.from)
        : startOfDay(new Date())
      const end = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(new Date())

      const { data } = await getAppointmentsForRange(
        start,
        end,
        selectedProfessional,
      )
      setAppointments(data || [])
      setIsLoading(false)
    }
    fetchData()
  }, [selectedProfessional, dateRange])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">
          Nenhum agendamento encontrado para o período selecionado.
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Profissional</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appt) => {
            const hasMissingNotes =
              appt.status === 'completed' &&
              (!appt.notes || appt.notes.length === 0)

            return (
              <TableRow key={appt.id}>
                <TableCell>
                  {format(new Date(appt.schedules.start_time), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  {formatInTimeZone(appt.schedules.start_time, 'HH:mm')}
                </TableCell>
                <TableCell className="font-medium">
                  {appt.clients.name}
                </TableCell>
                <TableCell>{appt.services.name}</TableCell>
                <TableCell>{appt.professionals.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        appt.status === 'completed'
                          ? 'secondary'
                          : appt.status === 'cancelled'
                            ? 'destructive'
                            : 'default'
                      }
                    >
                      {appt.status}
                    </Badge>
                    {hasMissingNotes && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Notas pendentes</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAppointmentClick(appt)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

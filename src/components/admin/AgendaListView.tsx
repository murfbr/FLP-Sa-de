import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllAppointments } from '@/services/appointments'
import { getAllProfessionals } from '@/services/professionals'
import { Appointment, Professional } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface AgendaListViewProps {
  onAppointmentClick: (appointment: Appointment) => void
}

export const AgendaListView = ({ onAppointmentClick }: AgendaListViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const [profRes, apptRes] = await Promise.all([
        getAllProfessionals(),
        getAllAppointments(selectedProfessional),
      ])
      if (profRes.data) setProfessionals(profRes.data)
      if (apptRes.data) setAppointments(apptRes.data)
      setIsLoading(false)
    }
    fetchData()
  }, [selectedProfessional])

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-96 w-full" />
    }
    if (appointments.length === 0) {
      return (
        <div className="text-center py-16">Nenhum agendamento encontrado.</div>
      )
    }
    if (isMobile) {
      return (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <Card
              key={appt.id}
              onClick={() => onAppointmentClick(appt)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <CardHeader>
                <CardTitle className="text-base">{appt.clients.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(
                    new Date(appt.schedules.start_time),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR },
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
            {appointments.map((appt) => (
              <TableRow
                key={appt.id}
                onClick={() => onAppointmentClick(appt)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>{appt.clients.name}</TableCell>
                <TableCell>{appt.professionals.name}</TableCell>
                <TableCell>{appt.services.name}</TableCell>
                <TableCell>
                  {format(
                    new Date(appt.schedules.start_time),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR },
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={selectedProfessional}
          onValueChange={setSelectedProfessional}
        >
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Filtrar por profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Profissionais</SelectItem>
            {professionals.map((prof) => (
              <SelectItem key={prof.id} value={prof.id}>
                {prof.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {renderContent()}
    </div>
  )
}

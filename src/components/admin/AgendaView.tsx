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

export const AgendaView = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={selectedProfessional}
          onValueChange={setSelectedProfessional}
        >
          <SelectTrigger className="w-[280px]">
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
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
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
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhum agendamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appt) => (
                <TableRow key={appt.id}>
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
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

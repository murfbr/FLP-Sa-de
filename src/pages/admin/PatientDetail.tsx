import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClientById } from '@/services/clients'
import { getAppointmentsByClientId } from '@/services/appointments'
import { Client, Appointment } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [patient, setPatient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setIsLoading(true)
      const [patientRes, apptRes] = await Promise.all([
        getClientById(id),
        getAppointmentsByClientId(id),
      ])
      setPatient(patientRes.data)
      setAppointments(apptRes.data || [])
      setIsLoading(false)
    }
    fetchData()
  }, [id])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-48 md:col-span-1" />
          <Skeleton className="h-96 md:col-span-2" />
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold">Paciente não encontrado</h2>
        <Button asChild className="mt-4">
          <Link to="/">Voltar ao Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button asChild variant="outline" className="mb-6">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Link>
      </Button>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="w-6 h-6" />
              {patient.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{patient.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {patient.phone || 'Não informado'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              Histórico de Agendamentos
            </CardTitle>
            <CardDescription>
              Total de {appointments.length} agendamentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell>
                      {format(
                        new Date(appt.schedules.start_time),
                        'dd/MM/yyyy HH:mm',
                        { locale: ptBR },
                      )}
                    </TableCell>
                    <TableCell>{appt.services.name}</TableCell>
                    <TableCell>{appt.professionals.name}</TableCell>
                    <TableCell>
                      <Badge>{appt.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PatientDetail

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, User, FileText, Edit } from 'lucide-react'
import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { ProfessionalAppointmentDialog } from '@/components/professional/ProfessionalAppointmentDialog'

const ProfessionalPatientDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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

  useEffect(() => {
    fetchData()
  }, [id])

  const handleEditNotes = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDialogOpen(true)
  }

  const validAppointments = appointments.filter(
    (appt) =>
      appt.schedules?.start_time &&
      isValid(new Date(appt.schedules.start_time)),
  )

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
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <Button onClick={() => navigate(-1)} variant="outline" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista
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
                <FileText className="w-6 h-6" />
                Prontuário e Histórico
              </CardTitle>
              <CardDescription>
                Total de {validAppointments.length} agendamentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {validAppointments.map((appt) => (
                  <AccordionItem value={appt.id} key={appt.id}>
                    <AccordionTrigger>
                      <div className="flex justify-between w-full pr-4">
                        <span>
                          {appt.services.name} com {appt.professionals.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(
                            new Date(appt.schedules.start_time),
                            'dd/MM/yyyy',
                            { locale: ptBR },
                          )}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="flex justify-between items-start">
                        <div>
                          <p>
                            <strong>Status:</strong>{' '}
                            <Badge>{appt.status}</Badge>
                          </p>
                          <p>
                            <strong>Anotações da Sessão:</strong>
                          </p>
                          <div className="p-2 border rounded-md bg-muted/50 min-h-[60px]">
                            {appt.notes || 'Nenhuma anotação para esta sessão.'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditNotes(appt)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Detalhes
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
      <ProfessionalAppointmentDialog
        appointment={selectedAppointment}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUpdate={fetchData}
      />
    </>
  )
}

export default ProfessionalPatientDetail

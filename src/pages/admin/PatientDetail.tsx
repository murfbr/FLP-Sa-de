import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getClientById, updateClient, deleteClient } from '@/services/clients'
import { getAppointmentsByClientId } from '@/services/appointments'
import { Client, Appointment } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  FileText,
  Edit,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { PatientEditDialog } from '@/components/admin/PatientEditDialog'

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [patient, setPatient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const fetchPatientData = async () => {
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
    fetchPatientData()
  }, [id])

  const handleStatusChange = async (isActive: boolean) => {
    if (!patient) return
    const { data, error } = await updateClient(patient.id, {
      is_active: isActive,
    })
    if (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    } else if (data) {
      setPatient(data)
      toast({
        title: `Paciente ${isActive ? 'ativado' : 'inativado'} com sucesso!`,
      })
    }
  }

  const handleDelete = async () => {
    if (!patient) return
    const { error } = await deleteClient(patient.id)
    if (error) {
      toast({ title: 'Erro ao excluir paciente', variant: 'destructive' })
    } else {
      toast({ title: 'Paciente excluído com sucesso!' })
      navigate('/')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-1" />
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
    <>
      <div className="container mx-auto py-8 px-4">
        <Button asChild variant="outline" className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <User className="w-6 h-6" />
                  {patient.name}
                </CardTitle>
                <Badge
                  variant={patient.is_active ? 'default' : 'destructive'}
                  className="w-fit"
                >
                  {patient.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
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
              <CardFooter className="flex flex-col gap-2">
                <div className="flex items-center space-x-2 w-full justify-between p-2 border rounded-md">
                  <Label htmlFor="status-switch">Status do Paciente</Label>
                  <Switch
                    id="status-switch"
                    checked={patient.is_active}
                    onCheckedChange={handleStatusChange}
                  />
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Paciente
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full" variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Paciente
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Tem certeza que deseja excluir?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá
                        permanentemente o paciente e todos os seus dados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          </div>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                Histórico de Agendamentos
              </CardTitle>
              <CardDescription>
                Total de {appointments.length} agendamentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {appointments.map((appt) => (
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
                    <AccordionContent className="prose prose-sm max-w-none">
                      <p>
                        <strong>Status:</strong> <Badge>{appt.status}</Badge>
                      </p>
                      <p>
                        <strong>Anotações da Sessão:</strong>
                      </p>
                      <div className="p-2 border rounded-md bg-muted/50">
                        {appt.notes || 'Nenhuma anotação para esta sessão.'}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
      <PatientEditDialog
        patient={patient}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onPatientUpdated={setPatient}
      />
    </>
  )
}

export default PatientDetail

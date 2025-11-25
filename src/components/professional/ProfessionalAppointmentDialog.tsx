import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/hooks/use-toast'
import {
  updateAppointmentNotes,
  markAppointmentAsNoShow,
  completeAppointment,
} from '@/services/appointments'
import { Appointment } from '@/types'
import { format, addMinutes, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  User,
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  CalendarClock,
  Loader2,
} from 'lucide-react'
import { RescheduleDialog } from './RescheduleDialog'

interface ProfessionalAppointmentDialogProps {
  appointment: Appointment | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onUpdate: () => void
}

export const ProfessionalAppointmentDialog = ({
  appointment,
  isOpen,
  onOpenChange,
  onUpdate,
}: ProfessionalAppointmentDialogProps) => {
  const { toast } = useToast()
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)

  useEffect(() => {
    if (appointment) {
      setNotes(appointment.notes || '')
    }
  }, [appointment, isOpen])

  if (
    !appointment ||
    !appointment.schedules?.start_time ||
    !isValid(new Date(appointment.schedules.start_time))
  ) {
    return null
  }

  const startTime = new Date(appointment.schedules.start_time)
  const duration = appointment.services.duration_minutes || 30
  const endTime = addMinutes(startTime, duration)

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    const { error } = await updateAppointmentNotes(appointment.id, notes)
    if (error) {
      toast({ title: 'Erro ao salvar anotações', variant: 'destructive' })
    } else {
      toast({ title: 'Anotações salvas com sucesso!' })
      onUpdate()
    }
    setIsSavingNotes(false)
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    const { error } = await completeAppointment(appointment.id)
    if (error) {
      toast({
        title: 'Erro ao finalizar atendimento',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Atendimento finalizado com sucesso!' })
      onUpdate()
      onOpenChange(false)
    }
    setIsCompleting(false)
  }

  const handleNoShow = async () => {
    setIsMarkingNoShow(true)
    const { error } = await markAppointmentAsNoShow(appointment.id)
    if (error) {
      toast({
        title: 'Erro ao registrar falta',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Falta registrada com sucesso.' })
      onUpdate()
      onOpenChange(false)
    }
    setIsMarkingNoShow(false)
  }

  const handleRescheduleSuccess = () => {
    onUpdate()
    onOpenChange(false)
  }

  const canEdit = ['scheduled', 'confirmed'].includes(appointment.status)

  const DetailItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType
    label: string
    value: React.ReactNode
  }) => (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-primary mt-1" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Atendimento</DialogTitle>
            <DialogDescription>
              Gerencie o agendamento e prontuário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Info Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem
                icon={User}
                label="Paciente"
                value={appointment.clients.name}
              />
              <DetailItem
                icon={Stethoscope}
                label="Serviço"
                value={appointment.services.name}
              />
              <DetailItem
                icon={Calendar}
                label="Data"
                value={format(startTime, "dd 'de' MMMM", { locale: ptBR })}
              />
              <DetailItem
                icon={Clock}
                label="Horário"
                value={`${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`}
              />
              <DetailItem
                icon={FileText}
                label="Status"
                value={<Badge>{appointment.status}</Badge>}
              />
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <Label htmlFor="notes">Prontuário / Anotações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px]"
                placeholder="Registre a evolução do paciente..."
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? 'Salvando...' : 'Salvar Notas'}
                </Button>
              </div>
            </div>

            {/* Actions Section */}
            {canEdit && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Ações do Agendamento
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleComplete}
                    disabled={isCompleting}
                  >
                    {isCompleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Finalizar Atendimento
                  </Button>

                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setIsRescheduleOpen(true)}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Remarcar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        <XCircle className="mr-2 h-4 w-4" />
                        Faltou
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Registrar Falta</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja marcar este agendamento como
                          "Não Compareceu"? O horário não ficará disponível para
                          outros agendamentos automaticamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleNoShow}>
                          Confirmar Falta
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RescheduleDialog
        isOpen={isRescheduleOpen}
        onOpenChange={setIsRescheduleOpen}
        oldAppointmentId={appointment.id}
        client={appointment.clients}
        service={appointment.services}
        professionalId={appointment.professional_id}
        onRescheduleSuccess={handleRescheduleSuccess}
      />
    </>
  )
}

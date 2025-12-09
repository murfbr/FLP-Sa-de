import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Appointment, NoteEntry } from '@/types'
import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  User,
  Stethoscope,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  Loader2,
  XCircle,
  CalendarClock,
  Send,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  completeAppointment,
  markAppointmentAsNoShow,
  addAppointmentNote,
} from '@/services/appointments'
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
import { RescheduleDialog } from './RescheduleDialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/AuthProvider'
import { formatInTimeZone } from '@/lib/utils'

interface AppointmentDetailDialogProps {
  appointment: Appointment | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onAppointmentUpdated: () => void
}

export const AppointmentDetailDialog = ({
  appointment,
  isOpen,
  onOpenChange,
  onAppointmentUpdated,
}: AppointmentDetailDialogProps) => {
  const { toast } = useToast()
  const { user, professionalId } = useAuth()
  const [isCompleting, setIsCompleting] = useState(false)
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)

  if (
    !appointment ||
    !appointment.schedules?.start_time ||
    !isValid(new Date(appointment.schedules.start_time))
  ) {
    return null
  }

  const handleCompleteAppointment = async () => {
    setIsCompleting(true)
    const { error } = await completeAppointment(appointment.id)
    if (error) {
      toast({
        title: 'Erro ao confirmar realização',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Agendamento confirmado com sucesso!' })
      onAppointmentUpdated()
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
      onAppointmentUpdated()
      onOpenChange(false)
    }
    setIsMarkingNoShow(false)
  }

  const handleRescheduleSuccess = () => {
    onAppointmentUpdated()
    onOpenChange(false)
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setIsSavingNote(true)

    const noteEntry: NoteEntry = {
      date: new Date().toISOString(),
      professional_id: professionalId || undefined,
      professional_name: user?.email || 'Administrador',
      content: newNote,
    }

    const { error } = await addAppointmentNote(appointment.id, noteEntry)
    if (error) {
      toast({ title: 'Erro ao adicionar nota', variant: 'destructive' })
    } else {
      toast({ title: 'Nota adicionada com sucesso!' })
      setNewNote('')
      onAppointmentUpdated()
    }
    setIsSavingNote(false)
  }

  const startTime = appointment.schedules.start_time
  const endTime = appointment.schedules.end_time
  const duration = appointment.services.duration_minutes || 30
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
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações completas sobre a sessão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem
                icon={User}
                label="Cliente"
                value={appointment.clients.name}
              />
              <DetailItem
                icon={Stethoscope}
                label="Serviço"
                value={appointment.services.name}
              />
              <DetailItem
                icon={Briefcase}
                label="Profissional"
                value={appointment.professionals.name}
              />
              <DetailItem
                icon={Calendar}
                label="Data"
                value={format(
                  new Date(startTime),
                  "EEEE, dd 'de' MMMM 'de' yyyy",
                  {
                    locale: ptBR,
                  },
                )}
              />
              <DetailItem
                icon={Clock}
                label="Horário"
                value={`${formatInTimeZone(startTime, 'HH:mm')} - ${formatInTimeZone(endTime, 'HH:mm')} (${duration} min)`}
              />
              <DetailItem
                icon={FileText}
                label="Status"
                value={<Badge>{appointment.status}</Badge>}
              />
            </div>

            <div className="space-y-3">
              <Label>Anotações</Label>
              <ScrollArea className="h-[150px] w-full rounded-md border p-4 bg-muted/20">
                {appointment.notes && appointment.notes.length > 0 ? (
                  <div className="space-y-4">
                    {appointment.notes.map((note, index) => (
                      <div
                        key={index}
                        className="bg-background p-3 rounded-lg border shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-xs text-primary">
                            {note.professional_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(note.date),
                              "dd/MM/yy 'às' HH:mm",
                              { locale: ptBR },
                            )}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma anotação registrada.
                  </p>
                )}
              </ScrollArea>
              <div className="flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                  placeholder="Adicionar nova anotação..."
                />
                <Button
                  size="icon"
                  className="h-auto"
                  onClick={handleAddNote}
                  disabled={isSavingNote || !newNote.trim()}
                >
                  {isSavingNote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {canEdit && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      <XCircle className="mr-2 h-4 w-4" />
                      Faltou
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Registrar Falta</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja marcar este agendamento como "Não
                        Compareceu"?
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

                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => setIsRescheduleOpen(true)}
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Remarcar
                </Button>

                <Button
                  onClick={handleCompleteAppointment}
                  disabled={isCompleting}
                  className="w-full sm:w-auto"
                >
                  {isCompleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Confirmar Realização
                </Button>
              </>
            )}
          </DialogFooter>
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

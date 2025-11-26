import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  addAppointmentNote,
  markAppointmentAsNoShow,
  completeAppointment,
  getAppointmentsByScheduleId,
} from '@/services/appointments'
import { Appointment, NoteEntry } from '@/types'
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
  Loader2,
  Send,
  Users,
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { getProfessionalById } from '@/services/professionals'
import { Separator } from '@/components/ui/separator'

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
  const { professionalId } = useAuth()
  const [newNote, setNewNote] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false)
  const [professionalName, setProfessionalName] = useState('')
  const [groupAppointments, setGroupAppointments] = useState<Appointment[]>([])
  const [isLoadingGroup, setIsLoadingGroup] = useState(false)

  useEffect(() => {
    if (professionalId) {
      getProfessionalById(professionalId).then(({ data }) => {
        if (data) setProfessionalName(data.name)
      })
    }
  }, [professionalId])

  // Reset state when dialog opens/closes or appointment changes
  useEffect(() => {
    if (!isOpen) {
      setNewNote('')
      setIsSavingNote(false)
      setIsCompleting(false)
      setIsMarkingNoShow(false)
      setGroupAppointments([])
    } else if (appointment) {
      // Fetch other appointments for the same schedule (group session)
      setIsLoadingGroup(true)
      getAppointmentsByScheduleId(appointment.schedule_id).then(({ data }) => {
        setGroupAppointments(data || [])
        setIsLoadingGroup(false)
      })
    }
  }, [isOpen, appointment])

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

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setIsSavingNote(true)

    const noteEntry: NoteEntry = {
      date: new Date().toISOString(),
      professional_id: professionalId || undefined,
      professional_name: professionalName || 'Profissional',
      content: newNote,
    }

    const { error } = await addAppointmentNote(appointment.id, noteEntry)
    if (error) {
      toast({ title: 'Erro ao adicionar nota', variant: 'destructive' })
    } else {
      toast({ title: 'Nota adicionada com sucesso!' })
      setNewNote('')
      onUpdate()
    }
    setIsSavingNote(false)
  }

  const handleComplete = async () => {
    // Check if there are existing notes
    const hasExistingNotes = appointment.notes && appointment.notes.length > 0
    // Check if there is a new note being typed
    const hasNewNote = newNote.trim().length > 0

    if (!hasExistingNotes && !hasNewNote) {
      toast({
        title: 'Anotação obrigatória',
        description:
          'Por favor, adicione uma anotação ao prontuário antes de finalizar o atendimento.',
        variant: 'destructive',
      })
      return
    }

    setIsCompleting(true)

    // If there is a new note, save it first
    if (hasNewNote) {
      const noteEntry: NoteEntry = {
        date: new Date().toISOString(),
        professional_id: professionalId || undefined,
        professional_name: professionalName || 'Profissional',
        content: newNote,
      }
      const { error: noteError } = await addAppointmentNote(
        appointment.id,
        noteEntry,
      )
      if (noteError) {
        toast({ title: 'Erro ao salvar nota', variant: 'destructive' })
        setIsCompleting(false)
        return
      }
      setNewNote('')
    }

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

  const canEdit = ['scheduled', 'confirmed'].includes(appointment.status)
  const maxAttendees = appointment.services.max_attendees || 1
  const currentAttendees = groupAppointments.filter(
    (a) => a.status !== 'cancelled',
  ).length

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
            {maxAttendees > 1 && (
              <DetailItem
                icon={Users}
                label="Ocupação"
                value={`${currentAttendees}/${maxAttendees} agendados`}
              />
            )}
          </div>

          {/* Group Session Details */}
          {maxAttendees > 1 &&
            !isLoadingGroup &&
            groupAppointments.length > 0 && (
              <div className="space-y-2">
                <Label>Participantes da Sessão</Label>
                <div className="bg-muted/20 rounded-md p-3 border">
                  <ul className="space-y-1">
                    {groupAppointments.map((appt) => (
                      <li
                        key={appt.id}
                        className="text-sm flex justify-between items-center"
                      >
                        <span
                          className={
                            appt.id === appointment.id ? 'font-bold' : ''
                          }
                        >
                          {appt.clients.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {appt.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          <Separator />

          {/* Notes Section */}
          <div className="space-y-3">
            <Label>Prontuário / Anotações</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/20">
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
                          {format(new Date(note.date), "dd/MM/yy 'às' HH:mm", {
                            locale: ptBR,
                          })}
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
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

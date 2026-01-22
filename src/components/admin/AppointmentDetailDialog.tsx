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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Appointment, NoteEntry } from '@/types'
import { format, isValid, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  User,
  Stethoscope,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Loader2,
  CalendarClock,
  Send,
  Trash2,
  DollarSign,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  addAppointmentNote,
  deleteAppointment,
  updateAppointmentStatus,
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
import { getFriendlyErrorMessage } from '@/lib/error-mapping'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AppointmentDetailDialogProps {
  appointment: Appointment | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onAppointmentUpdated: () => void
}

const statusOptions = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'no_show', label: 'Faltou' },
]

export const AppointmentDetailDialog = ({
  appointment,
  isOpen,
  onOpenChange,
  onAppointmentUpdated,
}: AppointmentDetailDialogProps) => {
  const { toast } = useToast()
  const { user, professionalId, role } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [localStatus, setLocalStatus] = useState<string | null>(null)

  useEffect(() => {
    if (appointment) {
      setLocalStatus(appointment.status)
    }
  }, [appointment])

  if (
    !appointment ||
    !appointment.schedules?.start_time ||
    !isValid(new Date(appointment.schedules.start_time))
  ) {
    return null
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error } = await deleteAppointment(appointment.id)
    if (error) {
      toast({
        title: 'Erro ao excluir agendamento',
        description: getFriendlyErrorMessage(error),
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Agendamento excluído com sucesso.' })
      onAppointmentUpdated()
      onOpenChange(false)
    }
    setIsDeleting(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true)
    // Optimistic Update
    setLocalStatus(newStatus)

    const { error } = await updateAppointmentStatus(appointment.id, newStatus)
    if (error) {
      // Revert if error
      setLocalStatus(appointment.status)
      toast({
        title: 'Erro ao atualizar status',
        description: getFriendlyErrorMessage(error),
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Status atualizado com sucesso.' })
      onAppointmentUpdated()
    }
    setIsUpdatingStatus(false)
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
      toast({
        title: 'Erro ao adicionar nota',
        description: getFriendlyErrorMessage(error),
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Nota adicionada com sucesso!' })
      setNewNote('')
      onAppointmentUpdated()
    }
    setIsSavingNote(false)
  }

  const startTime = appointment.schedules.start_time
  const duration = appointment.services.duration_minutes || 30
  const calculatedEndTime = addMinutes(new Date(startTime), duration)

  // Use local status for display to support optimistic updates
  const displayStatus = localStatus || appointment.status
  const canEdit = ['scheduled', 'confirmed'].includes(displayStatus)
  const isAdmin = role === 'admin'

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
        <div className="font-medium">{value}</div>
      </div>
    </div>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                value={
                  <div className="flex flex-col">
                    <span>{appointment.services.name}</span>
                    {appointment.discount_amount &&
                      appointment.discount_amount > 0 && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Desconto aplicado: R${' '}
                          {appointment.discount_amount.toFixed(2)}
                        </span>
                      )}
                  </div>
                }
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
                value={`${formatInTimeZone(startTime, 'HH:mm')} - ${formatInTimeZone(calculatedEndTime, 'HH:mm')} (${duration} min)`}
              />
              <DetailItem
                icon={FileText}
                label="Status"
                value={
                  isAdmin ? (
                    <Select
                      value={displayStatus}
                      onValueChange={handleStatusChange}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="capitalize">
                      {statusOptions.find((o) => o.value === displayStatus)
                        ?.label || displayStatus}
                    </Badge>
                  )
                }
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
            {/* Delete Button (Hard Delete) - Admin Only or special permission */}
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja{' '}
                      <strong>excluir permanentemente</strong> este registro?
                      <br />
                      Esta ação não pode ser desfeita. Para apenas cancelar e
                      manter o histórico, altere o status para "Cancelado".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Confirmar Exclusão'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {canEdit && (
              <>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => setIsRescheduleOpen(true)}
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Remarcar
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

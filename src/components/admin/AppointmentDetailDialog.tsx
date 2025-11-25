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
import { Appointment } from '@/types'
import { format, addMinutes, isValid } from 'date-fns'
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
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { completeAppointment } from '@/services/appointments'

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
  const [isCompleting, setIsCompleting] = useState(false)

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

  const startTime = new Date(appointment.schedules.start_time)
  const duration = appointment.services.duration_minutes || 30
  const endTime = addMinutes(startTime, duration)

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
          <DialogDescription>
            Informações completas sobre a sessão.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
            value={format(startTime, "EEEE, dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          />
          <DetailItem
            icon={Clock}
            label="Horário"
            value={`${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')} (${duration} min)`}
          />
          <DetailItem
            icon={FileText}
            label="Status"
            value={<Badge>{appointment.status}</Badge>}
          />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Anotações:</p>
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
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCompleteAppointment}
            disabled={appointment.status === 'completed' || isCompleting}
          >
            {isCompleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {isCompleting ? 'Confirmando...' : 'Confirmar Realização'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

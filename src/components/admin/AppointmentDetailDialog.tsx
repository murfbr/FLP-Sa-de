import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Appointment } from '@/types'
import { format, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  User,
  Stethoscope,
  Briefcase,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react'

interface AppointmentDetailDialogProps {
  appointment: Appointment | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const AppointmentDetailDialog = ({
  appointment,
  isOpen,
  onOpenChange,
}: AppointmentDetailDialogProps) => {
  if (!appointment) return null

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
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-sm text-muted-foreground">Anotações:</p>
            <div className="p-3 border rounded-md bg-muted/50 min-h-[80px]">
              {appointment.notes || 'Nenhuma anotação para esta sessão.'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

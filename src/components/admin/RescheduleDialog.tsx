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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn, formatInTimeZone } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { Schedule, Client, Service, Professional } from '@/types'
import { getFilteredAvailableSchedules } from '@/services/schedules'
import { getAvailableDatesForProfessional } from '@/services/availability'
import { rescheduleAppointment } from '@/services/appointments'
import { getProfessionalsByService } from '@/services/professionals'
import { AvailableSlots } from '@/components/AvailableSlots'

interface RescheduleDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  oldAppointmentId: string
  client: Client
  service: Service
  professionalId: string
  onRescheduleSuccess: () => void
}

export const RescheduleDialog = ({
  isOpen,
  onOpenChange,
  oldAppointmentId,
  client,
  service,
  professionalId,
  onRescheduleSuccess,
}: RescheduleDialogProps) => {
  const { toast } = useToast()
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [availableDates, setAvailableDates] = useState<string[] | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isLoadingDates, setIsLoadingDates] = useState(false)
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Professional selection state
  const [selectedProfessionalId, setSelectedProfessionalId] =
    useState<string>(professionalId)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false)

  // Initialize and fetch professionals
  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(new Date())
      setDate(undefined)
      setSelectedSlotTime(null)
      setSchedules([])
      // Reset professional to the one currently assigned to the appointment
      setSelectedProfessionalId(professionalId)

      setIsLoadingProfessionals(true)
      getProfessionalsByService(service.id).then((res) => {
        setProfessionals(res.data || [])
        setIsLoadingProfessionals(false)
      })
    }
  }, [isOpen, professionalId, service.id])

  // Fetch available dates when professional or month changes
  useEffect(() => {
    if (isOpen && selectedProfessionalId) {
      setIsLoadingDates(true)
      getAvailableDatesForProfessional(
        selectedProfessionalId,
        service.id,
        currentMonth,
      ).then((res) => {
        setAvailableDates(res.data || [])
        setIsLoadingDates(false)
      })
    }
  }, [isOpen, selectedProfessionalId, service.id, currentMonth])

  // Fetch schedules when date changes
  useEffect(() => {
    if (date && selectedProfessionalId) {
      setIsLoadingSchedules(true)
      getFilteredAvailableSchedules(
        selectedProfessionalId,
        service.id,
        date,
      ).then((res) => {
        setSchedules(res.data || [])
        setSelectedSlotTime(null)
        setIsLoadingSchedules(false)
      })
    } else {
      setSchedules([])
    }
  }, [date, selectedProfessionalId, service.id])

  const handleReschedule = async () => {
    if (!selectedSlotTime || !date || !selectedProfessionalId) return
    setIsSubmitting(true)

    const { error } = await rescheduleAppointment(
      oldAppointmentId,
      selectedProfessionalId,
      selectedSlotTime,
    )

    if (error) {
      toast({
        title: 'Erro ao remarcar agendamento',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Agendamento remarcado com sucesso!' })
      onRescheduleSuccess()
      onOpenChange(false)
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Remarcar Agendamento</DialogTitle>
          <DialogDescription>
            Selecione um profissional, uma nova data e horário para{' '}
            {client.name} ({service.name}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Profissional</label>
            <Select
              value={selectedProfessionalId}
              onValueChange={(val) => {
                setSelectedProfessionalId(val)
                setDate(undefined)
                setSchedules([])
              }}
              disabled={isLoadingProfessionals}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Nova Data</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full pl-3 text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                  disabled={!selectedProfessionalId}
                >
                  {date ? (
                    format(date, 'PPP', { locale: ptBR })
                  ) : (
                    <span>Escolha uma data</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  disabled={(day) => {
                    if (day < new Date(new Date().setHours(0, 0, 0, 0)))
                      return true
                    if (availableDates) {
                      return !availableDates.includes(format(day, 'yyyy-MM-dd'))
                    }
                    return isLoadingDates
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {date && (
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Novo Horário</label>
              <AvailableSlots
                schedules={schedules}
                isLoading={isLoadingSchedules}
                selectedSlotTime={selectedSlotTime}
                onSlotSelect={(schedule) =>
                  setSelectedSlotTime(schedule.start_time)
                }
              />
              {selectedSlotTime && (
                <p className="text-sm text-muted-foreground mt-2">
                  Horário selecionado:{' '}
                  {formatInTimeZone(selectedSlotTime, 'HH:mm')}
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleReschedule}
            disabled={!selectedSlotTime || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSubmitting ? 'Remarcando...' : 'Confirmar Remarcação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
import { getFriendlyErrorMessage } from '@/lib/error-mapping'

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

  // Selection State
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null)

  // Data State
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [availableDates, setAvailableDates] = useState<string[] | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Loading State
  const [isLoadingDates, setIsLoadingDates] = useState(false)
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Professional selection state
  const [selectedProfessionalId, setSelectedProfessionalId] =
    useState<string>(professionalId)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false)

  // 1. Initialize and fetch professionals when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(new Date())
      setDate(undefined)
      setSelectedSlotTime(null)
      setSchedules([])
      setAvailableDates(null)
      // Reset professional to the one currently assigned to the appointment
      setSelectedProfessionalId(professionalId)

      setIsLoadingProfessionals(true)
      getProfessionalsByService(service.id)
        .then((res) => {
          setProfessionals(res.data || [])
        })
        .finally(() => {
          setIsLoadingProfessionals(false)
        })
    }
  }, [isOpen, professionalId, service.id])

  // 2. Fetch available dates when professional or month changes
  useEffect(() => {
    if (isOpen && selectedProfessionalId && service.id) {
      setIsLoadingDates(true)
      getAvailableDatesForProfessional(
        selectedProfessionalId,
        service.id,
        currentMonth,
      )
        .then((res) => {
          setAvailableDates(res.data || [])
        })
        .finally(() => {
          setIsLoadingDates(false)
        })
    }
  }, [isOpen, selectedProfessionalId, service.id, currentMonth])

  // 3. Fetch schedules (slots) when date changes
  useEffect(() => {
    if (isOpen && date && selectedProfessionalId && service.id) {
      setIsLoadingSchedules(true)
      getFilteredAvailableSchedules(selectedProfessionalId, service.id, date)
        .then((res) => {
          setSchedules(res.data || [])
          setSelectedSlotTime(null)
        })
        .finally(() => {
          setIsLoadingSchedules(false)
        })
    } else {
      setSchedules([])
    }
  }, [isOpen, date, selectedProfessionalId, service.id])

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
        description: getFriendlyErrorMessage(error),
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
              disabled={isLoadingProfessionals || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    {isLoadingProfessionals
                      ? 'Carregando...'
                      : 'Nenhum profissional disponível'}
                  </div>
                ) : (
                  professionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))
                )}
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
                  disabled={!selectedProfessionalId || isSubmitting}
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
                    // Always disable past dates
                    if (day < new Date(new Date().setHours(0, 0, 0, 0)))
                      return true
                    // If available dates are loaded, disable any date not in the list
                    if (availableDates) {
                      return !availableDates.includes(format(day, 'yyyy-MM-dd'))
                    }
                    // If strictly waiting for loading, we could disable
                    // returning isLoadingDates might block interaction during fetch
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
                  {formatInTimeZone(
                    selectedSlotTime,
                    "dd 'de' MMMM 'às' HH:mm",
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={!selectedSlotTime || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Remarcando...' : 'Confirmar Remarcação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

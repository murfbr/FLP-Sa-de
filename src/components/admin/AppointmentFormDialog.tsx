import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { Client, Professional, Service, Schedule } from '@/types'
import { getAllClients } from '@/services/clients'
import {
  getAllProfessionals,
  getServicesByProfessional,
} from '@/services/professionals'
import { getFilteredAvailableSchedules } from '@/services/schedules'
import { bookAppointment } from '@/services/appointments'
import { AvailableSlots } from '../AvailableSlots'

const appointmentSchema = z.object({
  clientId: z.string().uuid('Selecione um cliente.'),
  professionalId: z.string().uuid('Selecione um profissional.'),
  serviceId: z.string().uuid('Selecione um serviço.'),
  date: z.date({ required_error: 'Selecione uma data.' }),
  scheduleId: z.string().uuid('Selecione um horário.'),
})

type AppointmentFormValues = z.infer<typeof appointmentSchema>

interface AppointmentFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onAppointmentCreated: () => void
}

export const AppointmentFormDialog = ({
  isOpen,
  onOpenChange,
  onAppointmentCreated,
}: AppointmentFormDialogProps) => {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState({
    clients: true,
    professionals: true,
    services: false,
    schedules: false,
  })

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
  })

  const professionalId = form.watch('professionalId')
  const serviceId = form.watch('serviceId')
  const date = form.watch('date')

  useEffect(() => {
    Promise.all([getAllClients(), getAllProfessionals()]).then(
      ([clientRes, profRes]) => {
        setClients(clientRes.data || [])
        setProfessionals(profRes.data || [])
        setIsLoading((prev) => ({
          ...prev,
          clients: false,
          professionals: false,
        }))
      },
    )
  }, [])

  useEffect(() => {
    if (professionalId) {
      setIsLoading((prev) => ({ ...prev, services: true }))
      getServicesByProfessional(professionalId).then((res) => {
        setServices(res.data || [])
        form.setValue('serviceId', '')
        setIsLoading((prev) => ({ ...prev, services: false }))
      })
    } else {
      setServices([])
    }
  }, [professionalId, form])

  useEffect(() => {
    if (professionalId && serviceId && date) {
      setIsLoading((prev) => ({ ...prev, schedules: true }))
      getFilteredAvailableSchedules(professionalId, serviceId, date).then(
        (res) => {
          setSchedules(res.data || [])
          form.setValue('scheduleId', '')
          setIsLoading((prev) => ({ ...prev, schedules: false }))
        },
      )
    } else {
      setSchedules([])
    }
  }, [professionalId, serviceId, date, form])

  const onSubmit = async (values: AppointmentFormValues) => {
    const { error } = await bookAppointment(
      values.scheduleId,
      values.clientId,
      values.serviceId,
    )
    if (error) {
      toast({
        title: 'Erro ao agendar',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Agendamento criado com sucesso!' })
      onAppointmentCreated()
      onOpenChange(false)
      form.reset()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para criar um novo agendamento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="professionalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profissional</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {professionals.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!professionalId || isLoading.services}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scheduleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário</FormLabel>
                  <FormControl>
                    <AvailableSlots
                      schedules={schedules}
                      isLoading={isLoading.schedules}
                      onSlotSelect={(schedule) => field.onChange(schedule.id)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Agendar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

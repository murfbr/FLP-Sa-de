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
  FormDescription,
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
import { CalendarIcon, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { cn, formatInTimeZone } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import {
  Client,
  Professional,
  Service,
  Schedule,
  ClientPackageWithDetails,
} from '@/types'
import {
  getAllClients,
  getClientPackages,
  getClientSubscriptions,
} from '@/services/clients'
import {
  getAllProfessionals,
  getServicesByProfessional,
} from '@/services/professionals'
import {
  getFilteredAvailableSchedules,
  getAvailableProfessionalsForSlot,
} from '@/services/schedules'
import { getAvailableDatesForProfessional } from '@/services/availability'
import { bookAppointment } from '@/services/appointments'
import { AvailableSlots } from '../AvailableSlots'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const appointmentSchema = z.object({
  clientId: z.string().uuid('Selecione um cliente.'),
  professionalId: z.string().uuid('Selecione um profissional.'),
  serviceId: z.string().uuid('Selecione um serviço.'),
  date: z.date({ required_error: 'Selecione uma data.' }),
  scheduleId: z.string().uuid('Selecione um horário.'),
  usePackage: z.boolean().default(true),
  packageId: z.string().optional(),
})

type AppointmentFormValues = z.infer<typeof appointmentSchema>

interface AppointmentFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onAppointmentCreated: () => void
  initialDate?: Date
  preselectedProfessionalId?: string
}

export const AppointmentFormDialog = ({
  isOpen,
  onOpenChange,
  onAppointmentCreated,
  initialDate,
  preselectedProfessionalId,
}: AppointmentFormDialogProps) => {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [availableDates, setAvailableDates] = useState<string[] | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isFilteredByTime, setIsFilteredByTime] = useState(false)
  const [isLoading, setIsLoading] = useState({
    clients: true,
    professionals: true,
    services: false,
    schedules: false,
    dates: false,
  })

  // New states for package/subscription logic
  const [availablePackages, setAvailablePackages] = useState<
    ClientPackageWithDetails[]
  >([])
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [checkingEntitlements, setCheckingEntitlements] = useState(false)

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      usePackage: true,
      professionalId: preselectedProfessionalId || '',
      date: initialDate || undefined,
    },
  })

  const clientId = form.watch('clientId')
  const professionalId = form.watch('professionalId')
  const serviceId = form.watch('serviceId')
  const date = form.watch('date')
  const usePackage = form.watch('usePackage')

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      const initializeForm = async () => {
        setIsLoading((prev) => ({
          ...prev,
          clients: true,
          professionals: true,
        }))

        const [clientRes, profRes] = await Promise.all([
          getAllClients({ status: 'active' }),
          getAllProfessionals(),
        ])

        setClients(clientRes.data || [])
        let allProfessionals = profRes.data || []

        // Intelligent Filtering: If initialDate has a specific time (not 00:00:00 or default),
        // filter professionals who are available at that time.
        // We assume specific time if hours/minutes are not 0 (simplified check)
        // or if explicitly passed from a time slot click context (which sets initialDate).
        if (
          initialDate &&
          (initialDate.getHours() !== 0 || initialDate.getMinutes() !== 0)
        ) {
          setIsLoading((prev) => ({ ...prev, professionals: true }))
          const { data: availablePros } =
            await getAvailableProfessionalsForSlot(initialDate)

          if (availablePros && availablePros.length > 0) {
            setProfessionals(availablePros)
            setIsFilteredByTime(true)

            // If preselectedProfessionalId is not in the filtered list, clear it?
            // Or if no preselection, maybe auto-select if only 1?
            if (!preselectedProfessionalId && availablePros.length === 1) {
              form.setValue('professionalId', availablePros[0].id)
            }
          } else {
            // If no one is available (weird if clicked on slot), show all but warn?
            // Or just show all.
            setProfessionals(allProfessionals)
            setIsFilteredByTime(false)
          }
        } else {
          setProfessionals(allProfessionals)
          setIsFilteredByTime(false)
        }

        if (preselectedProfessionalId) {
          form.setValue('professionalId', preselectedProfessionalId)
        }
        if (initialDate) {
          form.setValue('date', initialDate)
          setCurrentMonth(initialDate)
        }

        setIsLoading((prev) => ({
          ...prev,
          clients: false,
          professionals: false,
        }))
      }

      initializeForm()
    } else {
      // Reset state on close
      setIsFilteredByTime(false)
    }
  }, [isOpen, initialDate, preselectedProfessionalId, form])

  // Fetch services when professional changes
  useEffect(() => {
    if (professionalId) {
      setIsLoading((prev) => ({ ...prev, services: true }))
      getServicesByProfessional(professionalId).then((res) => {
        setServices(res.data || [])
        setIsLoading((prev) => ({ ...prev, services: false }))
      })
    } else {
      setServices([])
    }
  }, [professionalId])

  // Check entitlements
  useEffect(() => {
    const checkEntitlements = async () => {
      if (!clientId || !serviceId) {
        setAvailablePackages([])
        setHasActiveSubscription(false)
        return
      }

      setCheckingEntitlements(true)
      const selectedService = services.find((s) => s.id === serviceId)

      if (selectedService?.value_type === 'session') {
        const { data } = await getClientPackages(clientId)
        const matchingPackages =
          data?.filter((pkg) => pkg.packages.service_id === serviceId) || []
        setAvailablePackages(matchingPackages)
        if (matchingPackages.length > 0) {
          form.setValue('packageId', matchingPackages[0].id)
          form.setValue('usePackage', true)
        }
      } else if (selectedService?.value_type === 'monthly') {
        const { data } = await getClientSubscriptions(clientId)
        const hasSub = data?.some((sub) => sub.service_id === serviceId)
        setHasActiveSubscription(!!hasSub)
      }

      setCheckingEntitlements(false)
    }

    checkEntitlements()
  }, [clientId, serviceId, services, form])

  // Fetch available dates
  useEffect(() => {
    if (professionalId && serviceId) {
      setIsLoading((prev) => ({ ...prev, dates: true }))
      getAvailableDatesForProfessional(professionalId, serviceId, currentMonth)
        .then((res) => {
          setAvailableDates(res.data || [])
        })
        .finally(() => {
          setIsLoading((prev) => ({ ...prev, dates: false }))
        })
    } else {
      setAvailableDates(null)
    }
  }, [professionalId, serviceId, currentMonth])

  // Fetch schedules
  useEffect(() => {
    if (professionalId && serviceId && date) {
      setIsLoading((prev) => ({ ...prev, schedules: true }))
      getFilteredAvailableSchedules(professionalId, serviceId, date).then(
        (res) => {
          setSchedules(res.data || [])
          setIsLoading((prev) => ({ ...prev, schedules: false }))

          // Auto-select schedule logic
          if (initialDate && initialDate.getDate() === date.getDate()) {
            const targetTime = formatInTimeZone(initialDate, 'HH:mm')
            const matchingSlot = res.data?.find(
              (s) => formatInTimeZone(s.start_time, 'HH:mm') === targetTime,
            )
            if (matchingSlot) {
              form.setValue('scheduleId', matchingSlot.id)
            }
          }
        },
      )
    } else {
      setSchedules([])
    }
  }, [professionalId, serviceId, date, form, initialDate])

  const selectedService = services.find((s) => s.id === serviceId)

  const onSubmit = async (values: AppointmentFormValues) => {
    if (selectedService?.value_type === 'monthly' && !hasActiveSubscription) {
      toast({
        title: 'Agendamento Bloqueado',
        description:
          'O cliente não possui uma assinatura ativa para este serviço.',
        variant: 'destructive',
      })
      return
    }

    const packageIdToUse =
      values.usePackage && availablePackages.length > 0
        ? values.packageId
        : undefined

    const { error } = await bookAppointment(
      values.scheduleId,
      values.clientId,
      values.serviceId,
      packageIdToUse,
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

  const handleClearTimeFilter = async () => {
    setIsFilteredByTime(false)
    setIsLoading((prev) => ({ ...prev, professionals: true }))
    const { data } = await getAllProfessionals()
    setProfessionals(data || [])
    setIsLoading((prev) => ({ ...prev, professionals: false }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            {isFilteredByTime ? (
              <span className="text-primary flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Exibindo apenas profissionais disponíveis às{' '}
                {initialDate && formatInTimeZone(initialDate, 'HH:mm')}.
              </span>
            ) : (
              'Preencha os detalhes para criar um novo agendamento.'
            )}
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
                  <div className="flex justify-between items-center">
                    <FormLabel>Profissional</FormLabel>
                    {isFilteredByTime && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={handleClearTimeFilter}
                        type="button"
                      >
                        Mostrar todos
                      </Button>
                    )}
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading.professionals}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {professionals.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum profissional disponível
                        </div>
                      ) : (
                        professionals.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))
                      )}
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
                          {s.name} {s.value_type === 'monthly' && '(Mensal)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entitlements UI logic same as before */}
            {!checkingEntitlements &&
              clientId &&
              serviceId &&
              selectedService && (
                <div className="p-4 bg-muted/30 rounded-lg border">
                  {selectedService.value_type === 'monthly' ? (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Status da Assinatura
                      </h4>
                      {hasActiveSubscription ? (
                        <div className="flex items-center text-green-600 gap-2 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Assinatura Ativa Confirmada</span>
                        </div>
                      ) : (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle className="text-sm font-semibold">
                            Assinatura Necessária
                          </AlertTitle>
                          <AlertDescription className="text-xs">
                            O cliente não possui uma assinatura ativa para este
                            serviço.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        Opções de Pagamento
                      </h4>
                      {availablePackages.length > 0 ? (
                        <FormField
                          control={form.control}
                          name="usePackage"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-background">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Usar Pacote de Sessões</FormLabel>
                                <FormDescription>
                                  {availablePackages.length} pacote(s)
                                  disponível.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Nenhum pacote disponível. Será cobrado como avulso.
                        </div>
                      )}

                      {usePackage && availablePackages.length > 0 && (
                        <FormField
                          control={form.control}
                          name="packageId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selecione o Pacote</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o pacote" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availablePackages.map((pkg) => (
                                    <SelectItem key={pkg.id} value={pkg.id}>
                                      {pkg.packages.name} (
                                      {pkg.sessions_remaining} restantes)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

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
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        disabled={(day) => {
                          if (day < new Date(new Date().setHours(0, 0, 0, 0)))
                            return true
                          if (professionalId && serviceId && availableDates) {
                            return !availableDates.includes(
                              format(day, 'yyyy-MM-dd'),
                            )
                          }
                          return false
                        }}
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
              <Button
                type="submit"
                disabled={
                  (selectedService?.value_type === 'monthly' &&
                    !hasActiveSubscription) ||
                  form.formState.isSubmitting
                }
              >
                {form.formState.isSubmitting ? 'Agendando...' : 'Agendar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

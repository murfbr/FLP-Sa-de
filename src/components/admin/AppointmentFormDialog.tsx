import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  CalendarIcon,
  CheckCircle,
  AlertCircle,
  Repeat,
  Loader2,
  ExternalLink,
} from 'lucide-react'
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
import { getProfessionalsByService } from '@/services/professionals'
import {
  getFilteredAvailableSchedules,
  getAvailableProfessionalsAtSlot,
} from '@/services/schedules'
import { getAvailableDatesForProfessional } from '@/services/availability'
import { getAllServices } from '@/services/services'
import {
  bookAppointment,
  bookRecurringAppointments,
} from '@/services/appointments'
import { AvailableSlots } from '../AvailableSlots'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/providers/AuthProvider'
import { ClientSelector } from './ClientSelector'

const appointmentSchema = z
  .object({
    clientId: z.string().uuid('Selecione um cliente.'),
    serviceId: z.string().uuid('Selecione um serviço.'),
    professionalId: z.string().uuid('Selecione um profissional.'),
    date: z.date({ required_error: 'Selecione uma data.' }),
    startTime: z.string().min(1, 'Selecione um horário.'),
    usePackage: z.boolean().default(true),
    packageId: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurrenceWeeks: z.coerce
      .number()
      .min(2, 'Mínimo de 2 semanas para recorrência')
      .max(52, 'Máximo de 52 semanas (1 ano)')
      .optional(),
    forceSingleCharge: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.isRecurring) {
        return !!data.recurrenceWeeks && data.recurrenceWeeks >= 2
      }
      return true
    },
    {
      message: 'Defina a duração da recorrência (mínimo 2 semanas).',
      path: ['recurrenceWeeks'],
    },
  )

type AppointmentFormValues = z.infer<typeof appointmentSchema>

interface AppointmentFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onAppointmentCreated: () => void
  initialDate?: Date
  isSpecificTimeSlot?: boolean
  preselectedProfessionalId?: string
}

export const AppointmentFormDialog = ({
  isOpen,
  onOpenChange,
  onAppointmentCreated,
  initialDate,
  isSpecificTimeSlot = false,
  preselectedProfessionalId,
}: AppointmentFormDialogProps) => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { role } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [availableDates, setAvailableDates] = useState<string[] | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isLoading, setIsLoading] = useState({
    clients: true,
    services: false,
    professionals: false,
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
      isRecurring: false,
      recurrenceWeeks: 4,
      startTime: '',
      serviceId: '',
      clientId: '',
      forceSingleCharge: false,
    },
  })

  const clientId = form.watch('clientId')
  const serviceId = form.watch('serviceId')
  const professionalId = form.watch('professionalId')
  const date = form.watch('date')
  const usePackage = form.watch('usePackage')
  const isRecurring = form.watch('isRecurring')
  const forceSingleCharge = form.watch('forceSingleCharge')
  const startTime = form.watch('startTime')

  // Initialize form: Fetch Clients and Services
  useEffect(() => {
    if (isOpen) {
      const initializeForm = async () => {
        setIsLoading((prev) => ({ ...prev, clients: true, services: true }))

        // Fetch Clients
        const { data: clientsData } = await getAllClients({ status: 'active' })
        setClients(clientsData || [])

        // Fetch Services
        const { data: servicesData } = await getAllServices()
        setServices(servicesData || [])

        setIsLoading((prev) => ({ ...prev, clients: false, services: false }))

        if (initialDate) {
          form.setValue('date', initialDate)
          setCurrentMonth(initialDate)
          if (isSpecificTimeSlot) {
            form.setValue('startTime', initialDate.toISOString())
          }
        }
      }

      initializeForm()
    } else {
      // Reset logic
      form.reset({
        usePackage: true,
        professionalId: preselectedProfessionalId || '',
        date: initialDate || undefined,
        isRecurring: false,
        recurrenceWeeks: 4,
        startTime: '',
        serviceId: '',
        clientId: '',
        forceSingleCharge: false,
      })
      setSchedules([])
      setProfessionals([])
    }
  }, [isOpen, initialDate, form, preselectedProfessionalId, isSpecificTimeSlot])

  // Fetch Professionals
  useEffect(() => {
    const fetchProfessionals = async () => {
      if (!serviceId) {
        setProfessionals([])
        return
      }

      setIsLoading((prev) => ({ ...prev, professionals: true }))

      let availablePros: Professional[] = []

      if (isSpecificTimeSlot && initialDate) {
        // Context Mode: Fetch available pros for this specific slot
        const { data } = await getAvailableProfessionalsAtSlot(
          serviceId,
          initialDate,
        )
        availablePros = data || []
      } else {
        // Manual Mode: Fetch all pros for service
        const { data: servicePros } = await getProfessionalsByService(serviceId)
        availablePros = servicePros || []
      }

      setProfessionals(availablePros)
      setIsLoading((prev) => ({ ...prev, professionals: false }))

      // Logic to preserve or reset professional selection
      const currentProfId = form.getValues('professionalId')
      if (currentProfId && !availablePros.find((p) => p.id === currentProfId)) {
        form.setValue('professionalId', '')
      }
    }

    fetchProfessionals()
  }, [serviceId, initialDate, isSpecificTimeSlot, form])

  // Check entitlements
  useEffect(() => {
    const checkEntitlements = async () => {
      // Reset forceSingleCharge when dependencies change
      form.setValue('forceSingleCharge', false)

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

  // Manual Mode: Fetch available dates
  useEffect(() => {
    if (!isSpecificTimeSlot && professionalId && serviceId) {
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
  }, [professionalId, serviceId, currentMonth, isSpecificTimeSlot])

  // Manual Mode: Fetch schedules
  useEffect(() => {
    if (!isSpecificTimeSlot && professionalId && serviceId && date) {
      setIsLoading((prev) => ({ ...prev, schedules: true }))
      getFilteredAvailableSchedules(professionalId, serviceId, date).then(
        (res) => {
          if (res.error) {
            console.error('Error fetching schedules:', res.error)
            setSchedules([])
          } else {
            const slots = res.data || []
            setSchedules(slots)

            if (initialDate && initialDate.getDate() === date.getDate()) {
              const targetTime = formatInTimeZone(initialDate, 'HH:mm')
              const matchingSlot = slots.find(
                (s) => formatInTimeZone(s.start_time, 'HH:mm') === targetTime,
              )
              if (matchingSlot) {
                form.setValue('startTime', matchingSlot.start_time)
              }
            }
          }
          setIsLoading((prev) => ({ ...prev, schedules: false }))
        },
      )
    } else if (!isSpecificTimeSlot) {
      setSchedules([])
    }
  }, [professionalId, serviceId, date, form, initialDate, isSpecificTimeSlot])

  const selectedService = services.find((s) => s.id === serviceId)

  const handleNavigateToProfile = () => {
    if (!clientId) return
    onOpenChange(false)
    const basePath =
      role === 'admin' ? '/admin/pacientes' : '/profissional/pacientes'
    navigate(`${basePath}/${clientId}`)
  }

  const onSubmit = async (values: AppointmentFormValues) => {
    if (
      selectedService?.value_type === 'monthly' &&
      !hasActiveSubscription &&
      !values.forceSingleCharge
    ) {
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

    console.log('[AppointmentForm] Submitting booking request:', {
      ...values,
      packageIdToUse,
    })

    try {
      let result

      if (
        values.isRecurring &&
        values.recurrenceWeeks &&
        values.recurrenceWeeks >= 2
      ) {
        // Bulk Recurring Booking
        result = await bookRecurringAppointments(
          values.professionalId,
          values.clientId,
          values.serviceId,
          values.startTime,
          values.recurrenceWeeks,
          packageIdToUse,
        )
      } else {
        // Single Booking
        result = await bookAppointment(
          values.professionalId,
          values.clientId,
          values.serviceId,
          values.startTime,
          packageIdToUse,
          values.isRecurring,
        )
      }

      if (result.error) {
        console.error('[AppointmentForm] Error during booking:', result.error)
        toast({
          title: 'Erro ao agendar',
          description:
            result.error.message || 'Falha ao processar agendamento.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Agendamento(s) criado(s) com sucesso!' })
        onAppointmentCreated()
        onOpenChange(false)
        form.reset()
      }
    } catch (err: any) {
      console.error('[AppointmentForm] Unexpected error:', err)
      toast({
        title: 'Erro inesperado',
        description:
          err.message || 'Ocorreu um erro desconhecido ao tentar agendar.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          {isSpecificTimeSlot && initialDate && (
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-2">
              <CalendarIcon className="w-4 h-4" />
              {formatInTimeZone(initialDate, "dd 'de' MMMM 'às' HH:mm")}
            </div>
          )}
          <DialogDescription>
            {isSpecificTimeSlot
              ? 'Selecione o cliente e serviço para este horário.'
              : 'Selecione o serviço e o profissional para confirmar o horário.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 1. Client Selection - Searchable */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <ClientSelector
                      clients={clients}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading.clients}
                      isLoading={isLoading.clients}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Service Selection */}
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue('professionalId', '')
                    }}
                    defaultValue={field.value}
                    disabled={isLoading.services}
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

            {/* 3. Professional Selection */}
            <FormField
              control={form.control}
              name="professionalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profissional</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!serviceId || isLoading.professionals}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {professionals.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          {serviceId
                            ? isSpecificTimeSlot
                              ? 'Nenhum profissional disponível neste horário'
                              : 'Nenhum profissional disponível'
                            : 'Selecione um serviço primeiro'}
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

            {/* Payment/Package Options */}
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
                        <div className="space-y-4">
                          {!forceSingleCharge && (
                            <Alert variant="destructive" className="py-2">
                              <AlertCircle className="h-4 w-4" />
                              <div className="ml-2 w-full">
                                <AlertTitle className="text-sm font-semibold">
                                  Assinatura Necessária
                                </AlertTitle>
                                <AlertDescription className="text-xs">
                                  O cliente não possui uma assinatura ativa para
                                  este serviço.
                                </AlertDescription>
                                <Button
                                  variant="link"
                                  className="p-0 h-auto text-xs text-destructive underline mt-1 flex items-center gap-1"
                                  onClick={handleNavigateToProfile}
                                  type="button"
                                >
                                  Ir para Perfil{' '}
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </Alert>
                          )}

                          <FormField
                            control={form.control}
                            name="forceSingleCharge"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Cobrança Única
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Permitir agendamento avulso sem assinatura.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
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

            {/* Recurring Option */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/20">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none w-full">
                      <FormLabel className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-primary" />
                        Repetir semanalmente
                      </FormLabel>
                      <FormDescription>
                        Agendar automaticamente para as próximas semanas.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isRecurring && (
                <FormField
                  control={form.control}
                  name="recurrenceWeeks"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2 border rounded-md p-4 bg-muted/10">
                      <FormLabel className="flex justify-between">
                        Duração da Recorrência
                        <span className="text-xs text-muted-foreground font-normal">
                          Max: 52 semanas
                        </span>
                      </FormLabel>
                      <div className="flex gap-2 items-center">
                        <FormControl>
                          <Input
                            type="number"
                            min={2}
                            max={52}
                            className="w-24"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <span className="text-sm text-muted-foreground">
                          semanas
                        </span>
                      </div>
                      <FormDescription>
                        O agendamento será repetido por {field.value} semanas a
                        partir da data selecionada.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Manual Date and Time Selection (Only if NOT in Context Mode) */}
            {!isSpecificTimeSlot && (
              <>
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex-1">
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
                                if (
                                  day <
                                  new Date(new Date().setHours(0, 0, 0, 0))
                                )
                                  return true
                                if (
                                  professionalId &&
                                  serviceId &&
                                  availableDates
                                ) {
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
                </div>
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <AvailableSlots
                          schedules={schedules}
                          isLoading={isLoading.schedules}
                          selectedSlotTime={field.value}
                          onSlotSelect={(schedule) =>
                            field.onChange(schedule.start_time)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  (selectedService?.value_type === 'monthly' &&
                    !hasActiveSubscription &&
                    !forceSingleCharge) ||
                  form.formState.isSubmitting ||
                  (!isSpecificTimeSlot && !form.watch('startTime')) ||
                  (isSpecificTimeSlot && !form.watch('startTime'))
                }
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

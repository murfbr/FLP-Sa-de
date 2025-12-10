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
import { CalendarIcon, CheckCircle, AlertCircle } from 'lucide-react'
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
import { getFilteredAvailableSchedules } from '@/services/schedules'
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

  // Set initial values when dialog opens or props change
  useEffect(() => {
    if (isOpen) {
      if (preselectedProfessionalId) {
        form.setValue('professionalId', preselectedProfessionalId)
      }
      if (initialDate) {
        form.setValue('date', initialDate)
        setCurrentMonth(initialDate)
      }
    }
  }, [isOpen, initialDate, preselectedProfessionalId, form])

  // Fetch initial data
  useEffect(() => {
    Promise.all([
      getAllClients({ status: 'active' }),
      getAllProfessionals(),
    ]).then(([clientRes, profRes]) => {
      setClients(clientRes.data || [])
      setProfessionals(profRes.data || [])
      setIsLoading((prev) => ({
        ...prev,
        clients: false,
        professionals: false,
      }))
    })
  }, [])

  // Fetch services when professional changes
  useEffect(() => {
    if (professionalId) {
      setIsLoading((prev) => ({ ...prev, services: true }))
      getServicesByProfessional(professionalId).then((res) => {
        setServices(res.data || [])
        // Only reset if serviceId is no longer valid or if we changed professional
        // form.resetField('serviceId')
        setIsLoading((prev) => ({ ...prev, services: false }))
      })
    } else {
      setServices([])
    }
  }, [professionalId])

  // Check entitlements (Packages or Subscriptions) when client and service are selected
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
        // Check for packages
        const { data } = await getClientPackages(clientId)
        const matchingPackages =
          data?.filter((pkg) => pkg.packages.service_id === serviceId) || []
        setAvailablePackages(matchingPackages)
        // Auto-select first package if available (sorted by date ascending in service)
        if (matchingPackages.length > 0) {
          form.setValue('packageId', matchingPackages[0].id)
          form.setValue('usePackage', true)
        }
      } else if (selectedService?.value_type === 'monthly') {
        // Check for subscription
        const { data } = await getClientSubscriptions(clientId)
        const hasSub = data?.some((sub) => sub.service_id === serviceId)
        setHasActiveSubscription(!!hasSub)
      }

      setCheckingEntitlements(false)
    }

    checkEntitlements()
  }, [clientId, serviceId, services, form])

  // Fetch available dates when dependencies change or month changes
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

          // Auto-select schedule if initialDate has time component matching a slot
          if (initialDate && initialDate.getDate() === date.getDate()) {
            // Extract HH:mm from initialDate
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
    // Validate monthly subscription
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                          {s.name} {s.value_type === 'monthly' && '(Mensal)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entitlements Logic UI */}
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
                            serviço. Ative-a no perfil do cliente antes de
                            agendar.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    // Session based
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
                                  disponível para este serviço.
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
                                      {pkg.sessions_remaining} restantes) -{' '}
                                      {format(
                                        new Date(pkg.purchase_date),
                                        'dd/MM/yyyy',
                                        { locale: ptBR },
                                      )}
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
                          // If no professional/service is selected, allow date pick (will be filtered later)
                          // But if we have them, use availableDates
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

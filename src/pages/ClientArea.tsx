import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  User,
  Stethoscope,
  CheckCircle,
  Info,
} from 'lucide-react'
import { getServices } from '@/services/services'
import { getProfessionalsByService } from '@/services/professionals'
import { getFilteredAvailableSchedules } from '@/services/schedules'
import { bookAppointment } from '@/services/appointments'
import { Service, Professional, Schedule } from '@/types'
import { AvailableSlots } from '@/components/AvailableSlots'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/providers/AuthProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const MOCK_CLIENT_ID = '8a3c6d2e-4b5f-4c6d-8e9f-0a1b2c3d4e5f' // This will be replaced by auth user

const ClientArea = () => {
  const { toast } = useToast()
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [schedules, setSchedules] = useState<Schedule[] | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<Schedule | null>(null)
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false)
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const fetchSchedules = useCallback(async () => {
    if (selectedProfessional && selectedDate && selectedService) {
      setIsLoadingSchedules(true)
      setSchedules(null)
      setSelectedSlot(null)
      const { data, error } = await getFilteredAvailableSchedules(
        selectedProfessional.id,
        selectedService.id,
        selectedDate,
      )
      if (error) {
        toast({
          title: 'Erro ao buscar horários',
          description: 'Tente novamente mais tarde.',
          variant: 'destructive',
        })
      } else {
        setSchedules(data)
      }
      setIsLoadingSchedules(false)
    }
  }, [selectedProfessional, selectedDate, selectedService, toast])

  useEffect(() => {
    const loadServices = async () => {
      setIsLoadingServices(true)
      const { data, error } = await getServices()
      if (error) {
        toast({
          title: 'Erro ao buscar serviços',
          description: 'Tente novamente mais tarde.',
          variant: 'destructive',
        })
      } else if (data) {
        setServices(data)
      }
      setIsLoadingServices(false)
    }
    loadServices()
  }, [toast])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const handleServiceChange = useCallback(
    async (serviceId: string) => {
      const service = services.find((s) => s.id === serviceId) || null
      setSelectedService(service)
      setSelectedProfessional(null)
      setSchedules(null)
      setSelectedSlot(null)
      setBookingSuccess(false)
      if (!service) return

      setIsLoadingProfessionals(true)
      const { data, error } = await getProfessionalsByService(serviceId)
      if (error) {
        toast({
          title: 'Erro ao buscar profissionais',
          description: 'Tente novamente mais tarde.',
          variant: 'destructive',
        })
        setProfessionals([])
      } else {
        setProfessionals(data || [])
      }
      setIsLoadingProfessionals(false)
    },
    [services, toast],
  )

  const handleProfessionalChange = (professionalId: string) => {
    const professional =
      professionals.find((p) => p.id === professionalId) || null
    setSelectedProfessional(professional)
    setSchedules(null)
    setSelectedSlot(null)
    setBookingSuccess(false)
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setBookingSuccess(false)
    }
  }

  const handleSlotSelect = (schedule: Schedule) => {
    setSelectedSlot(schedule)
    setBookingSuccess(false)
  }

  const handleBooking = async () => {
    if (!selectedSlot || !selectedService || !user) return
    setIsBooking(true)
    const { error } = await bookAppointment(
      selectedSlot.id,
      MOCK_CLIENT_ID,
      selectedService.id,
    )
    if (error) {
      toast({
        title: 'Erro ao agendar',
        description: error.message || 'Este horário não está mais disponível.',
        variant: 'destructive',
      })
      setSelectedSlot(null)
      fetchSchedules()
    } else {
      toast({
        title: 'Agendamento confirmado!',
        description: 'Sua sessão foi agendada com sucesso.',
        className: 'bg-primary text-primary-foreground',
      })
      setBookingSuccess(true)
    }
    setIsBooking(false)
  }

  if (bookingSuccess && selectedSlot) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center text-center">
        <Card className="w-full max-w-lg animate-fade-in-up">
          <CardHeader>
            <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Agendamento Confirmado!</CardTitle>
            <CardDescription>
              Os detalhes da sua sessão foram enviados para o seu e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-left">
            <p>
              <strong>Serviço:</strong> {selectedService?.name}
            </p>
            <p>
              <strong>Profissional:</strong> {selectedProfessional?.name}
            </p>
            <p>
              <strong>Data:</strong>{' '}
              {format(
                new Date(selectedSlot.start_time),
                "EEEE, dd 'de' MMMM 'de' yyyy",
                { locale: ptBR },
              )}
            </p>
            <p>
              <strong>Horário:</strong>{' '}
              {format(new Date(selectedSlot.start_time), 'HH:mm')}
            </p>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button
              className="w-full"
              onClick={() => {
                setBookingSuccess(false)
                setSelectedSlot(null)
                fetchSchedules()
              }}
            >
              Agendar outra sessão
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">Voltar para o início</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold font-sans">Agende sua Sessão</h1>
          <p className="text-lg text-muted-foreground">
            Encontre o melhor horário para você.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                1. Escolha o Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingServices ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  onValueChange={handleServiceChange}
                  value={selectedService?.id ?? ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {selectedService && (
            <Alert className="animate-fade-in">
              <Info className="h-4 w-4" />
              <AlertTitle>{selectedService.name}</AlertTitle>
              <AlertDescription>{selectedService.description}</AlertDescription>
            </Alert>
          )}

          {selectedService && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  2. Escolha o Profissional
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProfessionals ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    onValueChange={handleProfessionalChange}
                    value={selectedProfessional?.id ?? ''}
                    disabled={professionals.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          professionals.length > 0
                            ? 'Selecione um profissional'
                            : 'Nenhum profissional disponível'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        {selectedProfessional && (
          <div className="md:col-span-2 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  3. Escolha a Data e Hora
                </CardTitle>
                <CardDescription>
                  Selecione um dia e um horário disponível para{' '}
                  <strong>{selectedProfessional.name}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    disabled={(date) =>
                      date <
                      new Date(new Date().setDate(new Date().getDate() - 1))
                    }
                    locale={ptBR}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4 text-center md:text-left">
                    Horários para{' '}
                    {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '...'}
                  </h3>
                  <AvailableSlots
                    schedules={schedules}
                    isLoading={isLoadingSchedules}
                    onSlotSelect={handleSlotSelect}
                  />
                </div>
              </CardContent>
              {selectedSlot && (
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={handleBooking}
                    disabled={isBooking}
                  >
                    {isBooking
                      ? 'Confirmando...'
                      : `Confirmar Horário: ${format(new Date(selectedSlot.start_time), 'HH:mm')}`}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientArea

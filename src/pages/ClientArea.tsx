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
} from 'lucide-react'
import { getServices } from '@/services/services'
import { getProfessionalsByService } from '@/services/professionals'
import { getAvailableSchedules } from '@/services/schedules'
import { Service, Professional, Schedule } from '@/types'
import { AvailableSlots } from '@/components/AvailableSlots'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ClientArea = () => {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [schedules, setSchedules] = useState<Schedule[] | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<
    string | null
  >(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<Schedule | null>(null)
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false)
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)

  useEffect(() => {
    const fetchServices = async () => {
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
    fetchServices()
  }, [toast])

  const handleServiceChange = useCallback(
    async (serviceId: string) => {
      setSelectedService(serviceId)
      setSelectedProfessional(null)
      setSchedules(null)
      setSelectedSlot(null)
      setIsLoadingProfessionals(true)
      const { data, error } = await getProfessionalsByService(serviceId)
      if (error) {
        toast({
          title: 'Erro ao buscar profissionais',
          description: 'Tente novamente mais tarde.',
          variant: 'destructive',
        })
      } else if (data) {
        setProfessionals(data)
      }
      setIsLoadingProfessionals(false)
    },
    [toast],
  )

  const handleProfessionalChange = (professionalId: string) => {
    setSelectedProfessional(professionalId)
    setSchedules(null)
    setSelectedSlot(null)
  }

  useEffect(() => {
    if (selectedProfessional && selectedDate) {
      const fetchSchedules = async () => {
        setIsLoadingSchedules(true)
        setSchedules(null)
        setSelectedSlot(null)
        const { data, error } = await getAvailableSchedules(
          selectedProfessional,
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
      fetchSchedules()
    }
  }, [selectedProfessional, selectedDate, toast])

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleSlotSelect = (schedule: Schedule) => {
    setSelectedSlot(schedule)
    toast({
      title: 'Horário selecionado!',
      description: `Próximo passo seria a confirmação do agendamento.`,
    })
  }

  const serviceName = services.find((s) => s.id === selectedService)?.name
  const professionalName = professionals.find(
    (p) => p.id === selectedProfessional,
  )?.name

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
                  value={selectedService ?? ''}
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
                    value={selectedProfessional ?? ''}
                    disabled={professionals.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional" />
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
                  Selecione um dia e um horário disponível.
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
            </Card>
          </div>
        )}
      </div>
      {selectedSlot && (
        <Card className="mt-8 animate-fade-in-up">
          <CardHeader>
            <CardTitle>Resumo do Agendamento</CardTitle>
            <CardDescription>
              Confira os detalhes abaixo. O próximo passo seria a confirmação e
              pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-md">
              <p>
                <strong>Serviço:</strong> {serviceName}
              </p>
              <p>
                <strong>Profissional:</strong> {professionalName}
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
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Confirmar Agendamento (Em breve)</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

export default ClientArea

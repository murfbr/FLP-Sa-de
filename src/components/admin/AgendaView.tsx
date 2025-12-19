import { useState, useEffect } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  List,
  Calendar,
  View,
  Columns,
  PlusCircle,
  RefreshCw,
  PlayCircle,
  Loader2,
  Filter,
} from 'lucide-react'
import { AgendaListView } from './AgendaListView'
import { AgendaCalendarView } from './AgendaCalendarView'
import { AgendaWeekView } from './AgendaWeekView'
import { AgendaDayView } from './AgendaDayView'
import { Button } from '../ui/button'
import { AppointmentFormDialog } from './AppointmentFormDialog'
import { Appointment, Professional } from '@/types'
import { AppointmentDetailDialog } from './AppointmentDetailDialog'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { generateSchedules } from '@/services/system'
import { getAllProfessionals } from '@/services/professionals'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'
import { startOfMonth, endOfMonth } from 'date-fns'

export type ViewMode = 'list' | 'month' | 'week' | 'day'

export const AgendaView = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  // Lifted State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  const [professionals, setProfessionals] = useState<Professional[]>([])

  // Date Range Filter State (Primary for List View)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  // Quick Create State
  const [quickCreateDate, setQuickCreateDate] = useState<Date | undefined>(
    undefined,
  )

  const isMobile = useIsMobile()
  const { toast } = useToast()

  useEffect(() => {
    getAllProfessionals().then(({ data }) => {
      setProfessionals(data || [])
    })
  }, [])

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailOpen(true)
  }

  const handleDataRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1)
  }

  const handleTimeSlotClick = (date: Date) => {
    setQuickCreateDate(date)
    setIsFormOpen(true)
  }

  const handleOpenForm = () => {
    setQuickCreateDate(new Date())
    setIsFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) setQuickCreateDate(undefined)
  }

  const handleGenerateSchedules = async () => {
    setIsGenerating(true)
    toast({
      title: 'Iniciando geração de horários...',
      description: 'Este processo pode levar alguns minutos.',
    })

    const { data, error } = await generateSchedules(
      selectedProfessional !== 'all' ? selectedProfessional : undefined,
    )

    if (error) {
      toast({
        title: 'Erro ao gerar horários',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Geração de horários concluída!',
        description: data.message,
      })
      handleDataRefresh()
    }
    setIsGenerating(false)
  }

  const commonProps = {
    key: refreshKey,
    currentDate,
    onDateChange: setCurrentDate,
    onViewChange: setViewMode,
    onAppointmentClick: handleAppointmentClick,
    onTimeSlotClick: handleTimeSlotClick,
    selectedProfessional,
  }

  const renderView = () => {
    switch (viewMode) {
      case 'list':
        return <AgendaListView {...commonProps} dateRange={dateRange} />
      case 'month':
        return <AgendaCalendarView {...commonProps} />
      case 'week':
        return <AgendaWeekView {...commonProps} />
      case 'day':
        return <AgendaDayView {...commonProps} />
      default:
        return <AgendaListView {...commonProps} dateRange={dateRange} />
    }
  }

  const renderViewSwitcher = () => {
    if (isMobile) {
      return (
        <Select
          value={viewMode}
          onValueChange={(value: ViewMode) => value && setViewMode(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecionar visualização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">Lista</SelectItem>
            <SelectItem value="month">Mês</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="day">Dia</SelectItem>
          </SelectContent>
        </Select>
      )
    }
    return (
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(value: ViewMode) => value && setViewMode(value)}
      >
        <ToggleGroupItem value="list" aria-label="List view">
          <List className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="month" aria-label="Month view">
          <Calendar className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="week" aria-label="Week view">
          <View className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="day" aria-label="Day view">
          <Columns className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex flex-wrap gap-2 w-full xl:w-auto items-center">
            <Button onClick={handleOpenForm} className="flex-1 sm:flex-none">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>

            <Select
              value={selectedProfessional}
              onValueChange={setSelectedProfessional}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Profissionais</SelectItem>
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {viewMode === 'list' && (
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full sm:w-auto"
              />
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlayCircle className="mr-2 h-4 w-4" />
                  )}
                  Gerar Horários
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Gerar Horários Disponíveis
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso criará os horários na agenda para{' '}
                    {selectedProfessional === 'all'
                      ? 'todos os profissionais'
                      : 'o profissional selecionado'}{' '}
                    com base em suas configurações de disponibilidade até o fim
                    do próximo ano. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleGenerateSchedules}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDataRefresh}
              title="Atualizar Dados"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-full xl:w-auto">{renderViewSwitcher()}</div>
        </div>

        {renderView()}
      </div>
      <AppointmentFormDialog
        isOpen={isFormOpen}
        onOpenChange={handleFormClose}
        onAppointmentCreated={handleDataRefresh}
        initialDate={quickCreateDate}
        preselectedProfessionalId={
          selectedProfessional !== 'all' ? selectedProfessional : undefined
        }
      />
      <AppointmentDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        appointment={selectedAppointment}
        onAppointmentUpdated={handleDataRefresh}
      />
    </>
  )
}

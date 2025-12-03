import { useState } from 'react'
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
} from 'lucide-react'
import { AgendaListView } from './AgendaListView'
import { AgendaCalendarView } from './AgendaCalendarView'
import { AgendaWeekView } from './AgendaWeekView'
import { AgendaDayView } from './AgendaDayView'
import { Button } from '../ui/button'
import { AppointmentFormDialog } from './AppointmentFormDialog'
import { Appointment } from '@/types'
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

type ViewMode = 'list' | 'month' | 'week' | 'day'

export const AgendaView = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const isMobile = useIsMobile()
  const { toast } = useToast()

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailOpen(true)
  }

  const handleDataRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1)
  }

  const handleGenerateSchedules = async () => {
    setIsGenerating(true)
    toast({
      title: 'Iniciando geração de horários...',
      description: 'Este processo pode levar alguns minutos.',
    })

    const { data, error } = await generateSchedules()

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

  const renderView = () => {
    const props = {
      key: refreshKey,
      onAppointmentClick: handleAppointmentClick,
    }
    switch (viewMode) {
      case 'list':
        return <AgendaListView {...props} />
      case 'month':
        return <AgendaCalendarView {...props} />
      case 'week':
        return <AgendaWeekView {...props} />
      case 'day':
        return <AgendaDayView {...props} />
      default:
        return <AgendaListView {...props} />
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
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <Button
              onClick={() => setIsFormOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>

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
                    Isso criará os horários na agenda para todos os
                    profissionais com base em suas configurações de
                    disponibilidade até o fim do próximo ano. Deseja continuar?
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
        onOpenChange={setIsFormOpen}
        onAppointmentCreated={handleDataRefresh}
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

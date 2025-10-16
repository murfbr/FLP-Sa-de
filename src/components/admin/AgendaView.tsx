import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { List, Calendar, View, Columns, PlusCircle } from 'lucide-react'
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

type ViewMode = 'list' | 'month' | 'week' | 'day'

export const AgendaView = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const isMobile = useIsMobile()

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailOpen(true)
  }

  const handleDataRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1)
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button
            onClick={() => setIsFormOpen(true)}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
          {renderViewSwitcher()}
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

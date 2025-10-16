import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { List, Calendar, View, Columns, PlusCircle } from 'lucide-react'
import { AgendaListView } from './AgendaListView'
import { AgendaCalendarView } from './AgendaCalendarView'
import { AgendaWeekView } from './AgendaWeekView'
import { AgendaDayView } from './AgendaDayView'
import { Button } from '../ui/button'
import { AppointmentFormDialog } from './AppointmentFormDialog'

type ViewMode = 'list' | 'month' | 'week' | 'day'

export const AgendaView = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const renderView = () => {
    switch (viewMode) {
      case 'list':
        return <AgendaListView key={refreshKey} />
      case 'month':
        return <AgendaCalendarView key={refreshKey} />
      case 'week':
        return <AgendaWeekView key={refreshKey} />
      case 'day':
        return <AgendaDayView key={refreshKey} />
      default:
        return <AgendaListView key={refreshKey} />
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
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
        </div>

        {renderView()}
      </div>
      <AppointmentFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onAppointmentCreated={() => {
          setRefreshKey((prevKey) => prevKey + 1)
        }}
      />
    </>
  )
}

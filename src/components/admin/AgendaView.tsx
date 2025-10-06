import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { List, Calendar, View, Columns } from 'lucide-react'
import { AgendaListView } from './AgendaListView'
import { AgendaCalendarView } from './AgendaCalendarView'
import { AgendaWeekView } from './AgendaWeekView'
import { AgendaDayView } from './AgendaDayView'

type ViewMode = 'list' | 'month' | 'week' | 'day'

export const AgendaView = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const renderView = () => {
    switch (viewMode) {
      case 'list':
        return <AgendaListView />
      case 'month':
        return <AgendaCalendarView />
      case 'week':
        return <AgendaWeekView />
      case 'day':
        return <AgendaDayView />
      default:
        return <AgendaListView />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
  )
}

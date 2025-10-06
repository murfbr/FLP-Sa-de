import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { List, Calendar } from 'lucide-react'
import { AgendaListView } from './AgendaListView'
import { AgendaCalendarView } from './AgendaCalendarView'

type ViewMode = 'list' | 'calendar'

export const AgendaView = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')

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
          <ToggleGroupItem value="calendar" aria-label="Calendar view">
            <Calendar className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {viewMode === 'list' ? <AgendaListView /> : <AgendaCalendarView />}
    </div>
  )
}

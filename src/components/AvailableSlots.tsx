import { Schedule } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatInTimeZone } from '@/lib/utils'

interface AvailableSlotsProps {
  schedules: Schedule[] | null
  isLoading: boolean
  onSlotSelect: (schedule: Schedule) => void
}

export const AvailableSlots = ({
  schedules,
  isLoading,
  onSlotSelect,
}: AvailableSlotsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">
        <p>Nenhum horário disponível para esta data.</p>
        <p className="text-sm">Por favor, selecione outro dia.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {schedules.map((schedule) => (
        <Button
          key={schedule.id}
          variant="outline"
          onClick={() => onSlotSelect(schedule)}
        >
          {formatInTimeZone(schedule.start_time, 'HH:mm')}
        </Button>
      ))}
    </div>
  )
}

import { Schedule } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatInTimeZone, cn } from '@/lib/utils'

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
      {schedules.map((schedule) => {
        const remaining =
          schedule.max_capacity && schedule.current_count !== undefined
            ? schedule.max_capacity - schedule.current_count
            : null

        // Only show capacity info if max_capacity > 1 (meaning it's a group session)
        const showCapacity =
          schedule.max_capacity &&
          schedule.max_capacity > 1 &&
          remaining !== null

        return (
          <Button
            key={schedule.id}
            variant="outline"
            className={cn(
              'flex flex-col items-center h-auto py-2',
              showCapacity ? 'gap-0.5' : '',
            )}
            onClick={() => onSlotSelect(schedule)}
          >
            <span className="text-sm font-medium">
              {formatInTimeZone(schedule.start_time, 'HH:mm')}
            </span>
            {showCapacity && (
              <span className="text-[10px] text-muted-foreground font-normal">
                {remaining} vaga{remaining !== 1 ? 's' : ''}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}

import { Schedule } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatInTimeZone, cn } from '@/lib/utils'

interface AvailableSlotsProps {
  schedules: Schedule[] | null
  isLoading: boolean
  onSlotSelect: (schedule: Schedule) => void
  selectedSlotTime?: string | null
}

export const AvailableSlots = ({
  schedules,
  isLoading,
  onSlotSelect,
  selectedSlotTime,
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
        const isSelected = selectedSlotTime === schedule.start_time
        const isPartial =
          (schedule.current_count || 0) > 0 &&
          (schedule.current_count || 0) < (schedule.max_capacity || 1)

        const spotsLeft =
          schedule.max_capacity && schedule.max_capacity > 1
            ? schedule.max_capacity - (schedule.current_count || 0)
            : null

        const capacityText = spotsLeft !== null ? `${spotsLeft} vagas` : null

        return (
          <Button
            key={schedule.start_time} // Use start_time as key since id might be missing
            variant={isSelected ? 'default' : 'outline'}
            className={cn(
              'flex flex-col items-center h-auto py-2 gap-0.5 relative overflow-hidden',
              isSelected && 'ring-2 ring-primary ring-offset-2',
              isPartial &&
                !isSelected &&
                'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-900',
            )}
            onClick={() => onSlotSelect(schedule)}
            type="button"
          >
            {isPartial && (
              <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-orange-400 m-1" />
            )}
            <span className="text-sm font-medium">
              {formatInTimeZone(schedule.start_time, 'HH:mm')}
            </span>
            {capacityText && (
              <span className="text-[10px] opacity-80 font-normal">
                {capacityText}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}

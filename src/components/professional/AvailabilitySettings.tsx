import { useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Trash2, PlusCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  getRecurringAvailability,
  setRecurringAvailability,
} from '@/services/availability'
import { Skeleton } from '../ui/skeleton'

const timeSlotSchema = z.object({
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
})

const daySchema = z.object({
  day_of_week: z.number(),
  enabled: z.boolean(),
  slots: z.array(timeSlotSchema),
})

const availabilitySchema = z.object({
  days: z.array(daySchema),
})

type AvailabilityFormValues = z.infer<typeof availabilitySchema>

const weekDays = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

interface AvailabilitySettingsProps {
  professionalId: string
}

export const AvailabilitySettings = ({
  professionalId,
}: AvailabilitySettingsProps) => {
  const { toast } = useToast()
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isLoading },
  } = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      days: weekDays.map((_, index) => ({
        day_of_week: index,
        enabled: false,
        slots: [],
      })),
    },
  })

  const { fields, update } = useFieldArray({
    control,
    name: 'days',
  })

  useEffect(() => {
    async function loadAvailability() {
      const { data } = await getRecurringAvailability(professionalId)
      const newDays = weekDays.map((_, index) => {
        const daySlots =
          data
            ?.filter((slot) => slot.day_of_week === index)
            .map((slot) => ({
              start_time: slot.start_time.slice(0, 5),
              end_time: slot.end_time.slice(0, 5),
            })) || []
        return {
          day_of_week: index,
          enabled: daySlots.length > 0,
          slots: daySlots,
        }
      })
      reset({ days: newDays })
    }
    loadAvailability()
  }, [professionalId, reset])

  const onSubmit = async (data: AvailabilityFormValues) => {
    const availabilities = data.days
      .filter((day) => day.enabled)
      .flatMap((day) =>
        day.slots.map((slot) => ({
          day_of_week: day.day_of_week,
          start_time: `${slot.start_time}:00`,
          end_time: `${slot.end_time}:00`,
        })),
      )

    const { error } = await setRecurringAvailability(
      professionalId,
      availabilities,
    )

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar sua disponibilidade.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso!',
        description: 'Sua disponibilidade foi atualizada.',
      })
    }
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horário de Trabalho Semanal</CardTitle>
        <CardDescription>
          Defina seus horários recorrentes. Eles serão usados para gerar vagas
          disponíveis para agendamento.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {fields.map((field, dayIndex) => (
            <div key={field.id} className="space-y-3">
              <div className="flex items-center space-x-3">
                <Controller
                  name={`days.${dayIndex}.enabled`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id={`day-${dayIndex}-enabled`}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label
                  htmlFor={`day-${dayIndex}-enabled`}
                  className="text-lg font-medium"
                >
                  {weekDays[dayIndex]}
                </Label>
              </div>
              <Controller
                name={`days.${dayIndex}.enabled`}
                control={control}
                render={({ field: enabledField }) =>
                  enabledField.value && (
                    <div className="pl-8 space-y-2">
                      <Controller
                        name={`days.${dayIndex}.slots`}
                        control={control}
                        render={({ field: { value: slots, onChange } }) => (
                          <>
                            {slots.map((_, slotIndex) => (
                              <div
                                key={slotIndex}
                                className="flex items-center gap-2"
                              >
                                <Controller
                                  name={`days.${dayIndex}.slots.${slotIndex}.start_time`}
                                  control={control}
                                  render={({ field }) => (
                                    <Input type="time" {...field} />
                                  )}
                                />
                                <span>-</span>
                                <Controller
                                  name={`days.${dayIndex}.slots.${slotIndex}.end_time`}
                                  control={control}
                                  render={({ field }) => (
                                    <Input type="time" {...field} />
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newSlots = [...slots]
                                    newSlots.splice(slotIndex, 1)
                                    onChange(newSlots)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onChange([
                                  ...slots,
                                  { start_time: '09:00', end_time: '17:00' },
                                ])
                              }
                            >
                              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                              Intervalo
                            </Button>
                          </>
                        )}
                      />
                    </div>
                  )
                }
              />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Disponibilidade'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

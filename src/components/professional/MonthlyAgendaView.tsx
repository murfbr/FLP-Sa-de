import { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getAppointmentsByProfessionalForRange } from '@/services/appointments'
import {
  getAvailabilityOverrides,
  blockDay,
  removeDayOverrides,
} from '@/services/availability'
import { Appointment, AvailabilityOverride } from '@/types'
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { useToast } from '@/hooks/use-toast'

interface MonthlyAgendaViewProps {
  professionalId: string
}

export const MonthlyAgendaView = ({
  professionalId,
}: MonthlyAgendaViewProps) => {
  const { toast } = useToast()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMonthData = useCallback(async () => {
    setIsLoading(true)
    const startDate = startOfMonth(currentMonth)
    const endDate = endOfMonth(currentMonth)
    const [apptRes, overrideRes] = await Promise.all([
      getAppointmentsByProfessionalForRange(
        professionalId,
        startDate.toISOString(),
        endDate.toISOString(),
      ),
      getAvailabilityOverrides(professionalId, currentMonth),
    ])
    setAppointments(apptRes.data || [])
    setOverrides(overrideRes.data || [])
    setIsLoading(false)
  }, [professionalId, currentMonth])

  useEffect(() => {
    fetchMonthData()
  }, [fetchMonthData])

  const { appointmentsOnSelectedDay, isSelectedDayBlocked } = useMemo(() => {
    if (!date)
      return { appointmentsOnSelectedDay: [], isSelectedDayBlocked: false }
    const selectedDayStr = format(date, 'yyyy-MM-dd')
    const dayOverride = overrides.find(
      (o) => o.override_date === selectedDayStr && !o.is_available,
    )
    return {
      appointmentsOnSelectedDay: appointments.filter((appt) =>
        isSameDay(new Date(appt.schedules.start_time), date),
      ),
      isSelectedDayBlocked: !!dayOverride,
    }
  }, [appointments, overrides, date])

  const blockedDays = useMemo(() => {
    return overrides
      .filter((o) => !o.is_available)
      .map((o) => parseISO(o.override_date))
  }, [overrides])

  const handleAvailabilityToggle = async (isAvailable: boolean) => {
    if (!date) return
    const promise = isAvailable
      ? removeDayOverrides(professionalId, date)
      : blockDay(professionalId, date)

    const { error } = await promise
    if (error) {
      toast({
        title: 'Erro ao atualizar disponibilidade',
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Disponibilidade atualizada com sucesso!' })
      fetchMonthData()
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border p-3"
            disabled={blockedDays}
            modifiers={{
              booked: appointments.map((a) => new Date(a.schedules.start_time)),
            }}
            modifiersStyles={{
              booked: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: 'hsl(var(--primary))',
              },
              disabled: {
                color: 'hsl(var(--destructive))',
                textDecoration: 'line-through',
              },
            }}
          />
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            Detalhes para {date ? format(date, 'dd/MM/yyyy') : '...'}
          </CardTitle>
          <CardDescription>
            {appointmentsOnSelectedDay.length} agendamento(s) encontrado(s).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointmentsOnSelectedDay.length > 0 ? (
            appointmentsOnSelectedDay.map((appt) => (
              <div
                key={appt.id}
                className="p-3 border rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{appt.clients.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {appt.services.name}
                  </p>
                </div>
                <Badge variant="secondary">
                  {format(new Date(appt.schedules.start_time), 'HH:mm')}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground pt-8">
              Nenhum agendamento para o dia selecionado.
            </p>
          )}
        </CardContent>
        {date && (
          <CardFooter className="border-t pt-4">
            <div className="flex items-center space-x-2 w-full justify-between">
              <Label htmlFor="availability-toggle" className="font-semibold">
                {isSelectedDayBlocked ? 'Dia Indisponível' : 'Dia Disponível'}
              </Label>
              <Switch
                id="availability-toggle"
                checked={!isSelectedDayBlocked}
                onCheckedChange={handleAvailabilityToggle}
              />
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

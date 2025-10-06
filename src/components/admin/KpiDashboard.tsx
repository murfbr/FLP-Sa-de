import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getCompletedAppointmentsCount,
  getFutureAppointmentsCount,
} from '@/services/appointments'
import { getInvoicedValue, getExpectedRevenue } from '@/services/financials'
import {
  DollarSign,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
} from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { addDays, startOfMonth } from 'date-fns'

const formatCurrency = (value: number | null) => {
  if (value === null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const KpiDashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })
  const [kpis, setKpis] = useState({
    completed: null as number | null,
    future: null as number | null,
    invoiced: null as number | null,
    expected: null as number | null,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchKpis = async () => {
      setIsLoading(true)
      const startDate = dateRange?.from?.toISOString() || ''
      const endDate = dateRange?.to?.toISOString() || ''

      const [completedRes, futureRes, invoicedRes, expectedRes] =
        await Promise.all([
          getCompletedAppointmentsCount(startDate, endDate),
          getFutureAppointmentsCount(),
          getInvoicedValue(startDate, endDate),
          getExpectedRevenue(),
        ])

      setKpis({
        completed: completedRes.data,
        future: futureRes.data,
        invoiced: invoicedRes.data,
        expected: expectedRes.data,
      })
      setIsLoading(false)
    }
    fetchKpis()
  }, [dateRange])

  const KpiCard = ({
    title,
    value,
    icon: Icon,
  }: {
    title: string
    value: string | number | null
    icon: React.ElementType
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Serviços Realizados"
          value={kpis.completed}
          icon={ClipboardCheck}
        />
        <KpiCard
          title="Agendamentos Futuros"
          value={kpis.future}
          icon={CalendarCheck}
        />
        <KpiCard
          title="Valor Faturado"
          value={formatCurrency(kpis.invoiced)}
          icon={DollarSign}
        />
        <KpiCard
          title="Expectativa de Faturamento"
          value={formatCurrency(kpis.expected)}
          icon={TrendingUp}
        />
      </div>
    </div>
  )
}

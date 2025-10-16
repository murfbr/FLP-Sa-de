import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getKpiMetrics,
  getServicePerformance,
  getPartnershipPerformance,
  getAnnualComparative,
} from '@/services/kpis'
import {
  DollarSign,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  BarChart,
  Users,
  Handshake,
} from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { startOfMonth } from 'date-fns'
import { DateRangePicker } from '../ui/date-range-picker'
import {
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const formatPercentage = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '0.0%'
  return `${value.toFixed(1)}%`
}

const KpiCard = ({
  title,
  value,
  comparison,
  icon: Icon,
  isLoading,
}: {
  title: string
  value: string | number
  comparison?: number
  icon: React.ElementType
  isLoading: boolean
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          {comparison !== undefined && (
            <p
              className={cn(
                'text-xs text-muted-foreground flex items-center',
                comparison >= 0 ? 'text-green-600' : 'text-red-600',
              )}
            >
              {comparison >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {comparison.toFixed(1)}% em relação ao período anterior
            </p>
          )}
        </>
      )}
    </CardContent>
  </Card>
)

const serviceChartConfig = {
  count: {
    label: 'Sessões',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

const partnershipChartConfig = {
  client_count: {
    label: 'Clientes',
    color: 'hsl(var(--chart-1))',
  },
  total_revenue: {
    label: 'Faturamento',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

const annualChartConfig = {
  total_revenue: {
    label: 'Faturamento',
    color: 'hsl(var(--chart-1))',
  },
  total_appointments: {
    label: 'Sessões',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export const KpiDashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })
  const [kpis, setKpis] = useState<any>(null)
  const [serviceData, setServiceData] = useState<any[]>([])
  const [partnershipData, setPartnershipData] = useState<any[]>([])
  const [annualData, setAnnualData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchKpis = async () => {
      if (!dateRange?.from || !dateRange?.to) return
      setIsLoading(true)
      const [kpiRes, serviceRes, partnershipRes, annualRes] = await Promise.all(
        [
          getKpiMetrics(dateRange.from, dateRange.to),
          getServicePerformance(dateRange.from, dateRange.to),
          getPartnershipPerformance(dateRange.from, dateRange.to),
          getAnnualComparative(),
        ],
      )

      setKpis(kpiRes.data)
      setServiceData(serviceRes.data || [])
      setPartnershipData(partnershipRes.data || [])
      setAnnualData(annualRes.data || [])
      setIsLoading(false)
    }
    fetchKpis()
  }, [dateRange])

  const revenueComparison =
    kpis && kpis.prev_total_revenue > 0
      ? ((kpis.total_revenue - kpis.prev_total_revenue) /
          kpis.prev_total_revenue) *
        100
      : kpis?.total_revenue > 0
        ? 100
        : 0

  const appointmentsComparison =
    kpis && kpis.prev_completed_appointments > 0
      ? ((kpis.completed_appointments - kpis.prev_completed_appointments) /
          kpis.prev_completed_appointments) *
        100
      : kpis?.completed_appointments > 0
        ? 100
        : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Faturamento no Período"
          value={formatCurrency(kpis?.total_revenue)}
          comparison={revenueComparison}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <KpiCard
          title="Sessões Realizadas"
          value={kpis?.completed_appointments ?? 0}
          comparison={appointmentsComparison}
          icon={CalendarCheck}
          isLoading={isLoading}
        />
        <KpiCard
          title="Taxa de Cancelamento"
          value={formatPercentage(kpis?.cancellation_rate)}
          comparison={
            kpis
              ? kpis.cancellation_rate - kpis.prev_cancellation_rate
              : undefined
          }
          icon={TrendingDown}
          isLoading={isLoading}
        />
        <KpiCard
          title="Total de Agendamentos"
          value={kpis?.total_appointments ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" /> Desempenho dos Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={serviceChartConfig}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer>
                <RechartsBarChart data={serviceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="service_name"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <RechartsBar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[0, 4, 4, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" /> Desempenho das Parcerias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={partnershipChartConfig}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer>
                <RechartsBarChart data={partnershipData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="partnership_name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <RechartsBar
                    yAxisId="left"
                    dataKey="client_count"
                    fill="var(--color-client_count)"
                    name="Clientes"
                  />
                  <RechartsBar
                    yAxisId="right"
                    dataKey="total_revenue"
                    fill="var(--color-total_revenue)"
                    name="Faturamento"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Comparativo Anual (Últimos 12 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={annualChartConfig}
            className="h-[400px] w-full"
          >
            <ResponsiveContainer>
              <LineChart data={annualData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="var(--color-total_revenue)"
                  name="Faturamento"
                />
                <Line
                  type="monotone"
                  dataKey="total_appointments"
                  stroke="var(--color-total_appointments)"
                  name="Sessões"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

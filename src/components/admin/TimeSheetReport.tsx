import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAllProfessionals } from '@/services/professionals'
import { getMonthlyTimeRecords } from '@/services/time-tracking'
import { Professional, TimeRecord } from '@/types'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Printer, FileText, Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export const TimeSheetReport = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth() + 1),
  )
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear()),
  )
  const [records, setRecords] = useState<TimeRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    getAllProfessionals().then(({ data }) => {
      if (data) setProfessionals(data)
    })
  }, [])

  const handleGenerate = async () => {
    if (!selectedProfessional) return
    setIsLoading(true)
    const { data } = await getMonthlyTimeRecords(
      selectedProfessional,
      parseInt(selectedYear),
      parseInt(selectedMonth),
    )
    setRecords(data || [])
    setIsLoading(false)
  }

  const calculateHours = (inTime: string, outTime: string | null) => {
    if (!outTime) return 0
    // Mock date to calculate difference purely on time
    const d1 = parseISO(`2000-01-01T${inTime}`)
    const d2 = parseISO(`2000-01-01T${outTime}`)
    const diff = differenceInMinutes(d2, d1)
    return diff > 0 ? diff / 60 : 0
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${String(m).padStart(2, '0')}m`
  }

  const totalHours = records.reduce((acc, r) => {
    return acc + calculateHours(r.clock_in, r.clock_out)
  }, 0)

  const handlePrint = () => {
    window.print()
  }

  const professionalName =
    professionals.find((p) => p.id === selectedProfessional)?.name ||
    'Profissional'

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Relatório de Ponto</CardTitle>
          <CardDescription>
            Gere relatórios de horas trabalhadas para a folha de pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Profissional</label>
              <Select
                value={selectedProfessional}
                onValueChange={setSelectedProfessional}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {format(new Date(2000, i, 1), 'MMMM', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={!selectedProfessional}>
              <Search className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report View */}
      {(records.length > 0 || isLoading) && (
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Folha de Ponto</CardTitle>
              <CardDescription>
                {professionalName} -{' '}
                <span className="capitalize">
                  {format(
                    new Date(
                      parseInt(selectedYear),
                      parseInt(selectedMonth) - 1,
                    ),
                    'MMMM yyyy',
                    { locale: ptBR },
                  )}
                </span>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="print:hidden"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum registro encontrado para este período.
              </div>
            ) : (
              <div className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Dia da Semana</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead className="text-right">
                        Horas Trabalhadas
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => {
                      const hours = calculateHours(
                        record.clock_in,
                        record.clock_out,
                      )
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            {format(
                              parseISO(`${record.date}T00:00:00`),
                              'dd/MM/yyyy',
                            )}
                          </TableCell>
                          <TableCell className="capitalize">
                            {format(
                              parseISO(`${record.date}T00:00:00`),
                              'EEEE',
                              { locale: ptBR },
                            )}
                          </TableCell>
                          <TableCell>{record.clock_in}</TableCell>
                          <TableCell>{record.clock_out || '-'}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatHours(hours)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={4} className="text-right">
                        Total Mensal:
                      </TableCell>
                      <TableCell className="text-right">
                        {formatHours(totalHours)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="hidden print:block pt-16 mt-8 border-t">
                  <div className="grid grid-cols-2 gap-12">
                    <div className="text-center border-t border-black pt-2">
                      <p>{professionalName}</p>
                      <p className="text-sm text-gray-500">Funcionário</p>
                    </div>
                    <div className="text-center border-t border-black pt-2">
                      <p>FPL Saúde</p>
                      <p className="text-sm text-gray-500">Empregador</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

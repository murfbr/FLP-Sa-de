import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getTodayRecord, upsertTimeRecord } from '@/services/time-tracking'
import { TimeRecord } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Clock, Loader2, Save, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TimeTrackerProps {
  professionalId: string
}

export const TimeTracker = ({ professionalId }: TimeTrackerProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [clockIn, setClockIn] = useState<string>('')
  const [clockOut, setClockOut] = useState<string>('')
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Generate 30-min interval times options
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2)
    const minutes = i % 2 === 0 ? '00' : '30'
    return `${String(hours).padStart(2, '0')}:${minutes}`
  })

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [professionalId])

  const fetchStatus = async () => {
    setIsLoading(true)
    const { data } = await getTodayRecord(professionalId)
    if (data) {
      if (data.clock_in) setClockIn(data.clock_in.substring(0, 5)) // Remove seconds if present
      if (data.clock_out) setClockOut(data.clock_out.substring(0, 5))
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!clockIn) {
      toast({
        title: 'Horário de Entrada Obrigatório',
        description: 'Por favor, selecione um horário de entrada.',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    const { error } = await upsertTimeRecord(
      professionalId,
      today,
      clockIn + ':00',
      clockOut ? clockOut + ':00' : null,
    )

    if (error) {
      toast({
        title: 'Erro ao salvar registro',
        description: 'Não foi possível salvar o ponto. Tente novamente.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Registro Salvo',
        description: 'Seus horários foram atualizados com sucesso.',
      })
    }
    setIsProcessing(false)
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-2">
        <div className="bg-primary/5 p-6 flex flex-col items-center justify-center border-b">
          <Clock className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-4xl font-mono font-bold tracking-wider text-primary">
            {format(currentTime, 'HH:mm:ss')}
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">
            {format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          </p>
        </div>

        <CardHeader>
          <CardTitle>Registro de Horas</CardTitle>
          <CardDescription>
            Selecione seus horários de entrada e saída.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Horário de Entrada
                </label>
                <Select value={clockIn} onValueChange={setClockIn}>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((time) => (
                      <SelectItem key={`in-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Horário de Saída</label>
                <Select value={clockOut} onValueChange={setClockOut}>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((time) => (
                      <SelectItem key={`out-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 pt-4">
                <Button
                  size="lg"
                  className="w-full h-12 text-lg"
                  onClick={handleSave}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-6 w-6" />
                  )}
                  Salvar Registro
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground border">
        <p className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          Mantenha seu registro atualizado diariamente. Você pode ajustar os
          horários a qualquer momento durante o dia.
        </p>
      </div>
    </div>
  )
}

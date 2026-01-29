import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { clockIn, clockOut, getTodayRecord } from '@/services/time-tracking'
import { TimeRecord } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Clock, LogIn, LogOut, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TimeTrackerProps {
  professionalId: string
}

export const TimeTracker = ({ professionalId }: TimeTrackerProps) => {
  const [activeRecord, setActiveRecord] = useState<TimeRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update clock every second
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
    setActiveRecord(data)
    setIsLoading(false)
  }

  const handleClockIn = async () => {
    setIsProcessing(true)
    const { data, error } = await clockIn(professionalId)
    if (error) {
      toast({
        title: 'Erro ao registrar entrada',
        description: 'Não foi possível registrar o ponto. Tente novamente.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Entrada registrada',
        description: `Entrada registrada às ${data?.clock_in}`,
      })
      setActiveRecord(data)
    }
    setIsProcessing(false)
  }

  const handleClockOut = async () => {
    if (!activeRecord) return
    setIsProcessing(true)
    const { data, error } = await clockOut(activeRecord.id)
    if (error) {
      toast({
        title: 'Erro ao registrar saída',
        description: 'Não foi possível registrar o ponto. Tente novamente.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Saída registrada',
        description: `Saída registrada às ${data?.clock_out}`,
      })
      setActiveRecord(null) // Reset active record as we closed it
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

        <CardContent className="pt-8">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeRecord ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Em Jornada de Trabalho
                </div>
                <p className="text-sm text-muted-foreground">
                  Entrada registrada às{' '}
                  <span className="font-bold text-foreground">
                    {activeRecord.clock_in}
                  </span>
                </p>
              </div>

              <Button
                size="lg"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-16 text-lg"
                onClick={handleClockOut}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-6 w-6" />
                )}
                Registrar Saída
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Fora de Jornada
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhum registro ativo no momento.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-16 text-lg"
                onClick={handleClockIn}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-6 w-6" />
                )}
                Registrar Entrada
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground border">
        <p className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          Lembre-se de registrar seus horários corretamente. O sistema calcula
          suas horas trabalhadas com base nestes registros para o fechamento da
          folha.
        </p>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Professional } from '@/types'
import { getAllProfessionals } from '@/services/professionals'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AvailabilitySettings } from '@/components/professional/AvailabilitySettings'
import { AvailabilityOverridesManager } from './AvailabilityOverridesManager'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { generateSchedules } from '@/services/system'
import { useToast } from '@/hooks/use-toast'
import { Loader2, PlayCircle } from 'lucide-react'

export const AdminAvailabilityManager = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<
    string | null
  >(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfessionals = async () => {
      setIsLoading(true)
      const { data } = await getAllProfessionals()
      setProfessionals(data || [])
      if (data && data.length > 0) {
        setSelectedProfessionalId(data[0].id)
      }
      setIsLoading(false)
    }
    fetchProfessionals()
  }, [])

  const handleGenerateSchedules = async () => {
    setIsGenerating(true)
    toast({
      title: 'Iniciando geração de horários...',
      description: 'Este processo pode levar alguns minutos.',
    })

    const { data, error } = await generateSchedules()

    if (error) {
      toast({
        title: 'Erro ao gerar horários',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Geração de horários concluída!',
        description: data.message,
      })
    }
    setIsGenerating(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Geração Automática de Agenda</CardTitle>
          <CardDescription>
            Execute o processo para criar os horários disponíveis para todos os
            profissionais com base em suas configurações de disponibilidade. O
            sistema irá gerar horários até o final de 2026.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleGenerateSchedules} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? 'Gerando...' : 'Executar Geração de Horários'}
          </Button>
        </CardFooter>
      </Card>

      <div>
        <label
          htmlFor="professional-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Selecione um Profissional para gerenciar disponibilidade individual
        </label>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select
            value={selectedProfessionalId || ''}
            onValueChange={setSelectedProfessionalId}
          >
            <SelectTrigger id="professional-select">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedProfessionalId ? (
        <div className="space-y-8">
          <AvailabilitySettings professionalId={selectedProfessionalId} />
          <AvailabilityOverridesManager
            professionalId={selectedProfessionalId}
          />
        </div>
      ) : (
        !isLoading && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum profissional encontrado ou selecionado.
          </p>
        )
      )}
    </div>
  )
}

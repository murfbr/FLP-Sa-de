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

export const AdminAvailabilityManager = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<
    string | null
  >(null)
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="professional-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Selecione um Profissional
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

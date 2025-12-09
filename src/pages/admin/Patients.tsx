import { useEffect, useState } from 'react'
import { getAllClients } from '@/services/clients'
import { Client } from '@/types'
import { PatientsList } from '@/components/admin/PatientsList'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { cleanCPF } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export default function Patients() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true)
      const { data } = await getAllClients()
      if (data) {
        setClients(data)
        setFilteredClients(data)
      }
      setIsLoading(false)
    }
    fetchClients()
  }, [])

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase()
    const cleanTerm = cleanCPF(searchTerm)

    const filtered = clients.filter((client) => {
      const matchesName = client.name.toLowerCase().includes(lowerTerm)
      const matchesCPF =
        cleanTerm.length > 0 && client.email.includes(cleanTerm)
      // We check if cleaned search term matches the stored CPF (email field)

      return matchesName || matchesCPF
    })
    setFilteredClients(filtered)
  }, [searchTerm, clients])

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciar Pacientes
        </h1>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CPF..."
          className="pl-8 max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <PatientsList patients={filteredClients} />
      )}
    </div>
  )
}

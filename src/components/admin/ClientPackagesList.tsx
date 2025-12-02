import { useEffect, useState } from 'react'
import { getClientPackages } from '@/services/clients'
import { ClientPackageWithDetails } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Package, Ticket } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ClientPackagesListProps {
  clientId: string
}

export const ClientPackagesList = ({ clientId }: ClientPackagesListProps) => {
  const [packages, setPackages] = useState<ClientPackageWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true)
      const { data } = await getClientPackages(clientId)
      setPackages(data || [])
      setIsLoading(false)
    }
    if (clientId) {
      fetchPackages()
    }
  }, [clientId])

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />
  }

  if (packages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" /> Pacotes Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum pacote ativo encontrado para este paciente.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" /> Pacotes Ativos
        </CardTitle>
        <CardDescription>
          Acompanhamento dos pacotes de serviços contratados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {packages.map((pkg) => {
          const totalSessions = pkg.packages.session_count
          const completedSessions = totalSessions - pkg.sessions_remaining
          const progress = (completedSessions / totalSessions) * 100

          return (
            <div key={pkg.id} className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-sm">{pkg.packages.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    Comprado em{' '}
                    {format(new Date(pkg.purchase_date), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  {completedSessions}/{totalSessions} sessões
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

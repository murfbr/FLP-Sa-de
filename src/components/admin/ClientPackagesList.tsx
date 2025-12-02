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
import { Ticket, PlusCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { AssignPackageDialog } from './AssignPackageDialog'

interface ClientPackagesListProps {
  clientId: string
}

export const ClientPackagesList = ({ clientId }: ClientPackagesListProps) => {
  const [packages, setPackages] = useState<ClientPackageWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchPackages = async () => {
    setIsLoading(true)
    const { data } = await getClientPackages(clientId)
    setPackages(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    if (clientId) {
      fetchPackages()
    }
  }, [clientId])

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" /> Pacotes Ativos
            </CardTitle>
            <CardDescription>
              Acompanhamento dos pacotes de serviços contratados.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum pacote ativo encontrado para este paciente.
            </p>
          ) : (
            packages.map((pkg) => {
              const totalSessions = pkg.packages.session_count
              const remainingSessions = pkg.sessions_remaining
              const completedSessions = totalSessions - remainingSessions
              const progress = (completedSessions / totalSessions) * 100

              return (
                <div key={pkg.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm">
                        {pkg.packages.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {pkg.packages.services?.name} - Comprado em{' '}
                        {format(new Date(pkg.purchase_date), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-right">
                      {remainingSessions}/{totalSessions} sessões restantes
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <AssignPackageDialog
        clientId={clientId}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onPackageAssigned={fetchPackages}
      />
    </>
  )
}

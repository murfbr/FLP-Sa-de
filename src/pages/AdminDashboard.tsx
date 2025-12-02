import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Calendar,
  Stethoscope,
  Briefcase,
  BarChart,
  LayoutDashboard,
  Handshake,
  Clock,
  PlusCircle,
  Package,
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { Professional, Client } from '@/types'
import { getAllProfessionals } from '@/services/professionals'
import { getAllClients } from '@/services/clients'
import { UpcomingAppointments } from '@/components/admin/UpcomingAppointments'
import { ProfessionalsList } from '@/components/admin/ProfessionalsList'
import { PatientsList } from '@/components/admin/PatientsList'
import { ServicesManager } from '@/components/admin/ServicesManager'
import { AgendaView } from '@/components/admin/AgendaView'
import { KpiDashboard } from '@/components/admin/KpiDashboard'
import { PartnershipsManager } from '@/components/admin/PartnershipsManager'
import { AdminAvailabilityManager } from '@/components/admin/AdminAvailabilityManager'
import { Button } from '@/components/ui/button'
import { PatientFormDialog } from '@/components/admin/PatientFormDialog'
import { ProfessionalFormDialog } from '@/components/admin/ProfessionalFormDialog'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PackagesManager } from '@/components/admin/PackagesManager'

type ClientStatusFilter = 'all' | 'active' | 'inactive'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false)
  const [isProfessionalFormOpen, setIsProfessionalFormOpen] = useState(false)
  const [clientStatusFilter, setClientStatusFilter] =
    useState<ClientStatusFilter>('active')

  const fetchData = async () => {
    setIsLoading(true)
    const [profRes, clientRes] = await Promise.all([
      getAllProfessionals(),
      getAllClients({ status: clientStatusFilter }),
    ])
    if (profRes.data) setProfessionals(profRes.data)
    if (clientRes.data) setClients(clientRes.data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [clientStatusFilter])

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-sans">
            Dashboard Administrativo
          </h1>
          <p className="text-md md:text-lg text-muted-foreground">
            Bem-vindo, {user?.email || 'Administrador'}.
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-auto p-1 mb-6 w-max flex-wrap sm:flex-nowrap">
              <TabsTrigger value="overview">
                <BarChart className="w-4 h-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="kpi">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Indicadores
              </TabsTrigger>
              <TabsTrigger value="agenda">
                <Calendar className="w-4 h-4 mr-2" />
                Agenda
              </TabsTrigger>
              <TabsTrigger value="availability">
                <Clock className="w-4 h-4 mr-2" />
                Disponibilidade
              </TabsTrigger>
              <TabsTrigger value="professionals">
                <Briefcase className="w-4 h-4 mr-2" />
                Profissionais
              </TabsTrigger>
              <TabsTrigger value="patients">
                <Users className="w-4 h-4 mr-2" />
                Pacientes
              </TabsTrigger>
              <TabsTrigger value="services">
                <Stethoscope className="w-4 h-4 mr-2" />
                Serviços
              </TabsTrigger>
              <TabsTrigger value="packages">
                <Package className="w-4 h-4 mr-2" />
                Pacotes
              </TabsTrigger>
              <TabsTrigger value="partnerships">
                <Handshake className="w-4 h-4 mr-2" />
                Parcerias
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <UpcomingAppointments />
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profissionais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-10 w-24" />
                    ) : (
                      <div className="text-3xl font-bold">
                        {professionals.length}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Profissionais cadastrados
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Pacientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-10 w-24" />
                    ) : (
                      <div className="text-3xl font-bold">{clients.length}</div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Pacientes ({clientStatusFilter})
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kpi">
            <KpiDashboard />
          </TabsContent>

          <TabsContent value="agenda">
            <Card>
              <CardHeader>
                <CardTitle>Agenda Centralizada</CardTitle>
              </CardHeader>
              <CardContent>
                <AgendaView />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Disponibilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminAvailabilityManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professionals">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>Gerenciar Profissionais</CardTitle>
                  <Button
                    onClick={() => setIsProfessionalFormOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Profissional
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ProfessionalsList professionals={professionals} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>Gerenciar Pacientes</CardTitle>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Select
                      value={clientStatusFilter}
                      onValueChange={(v) =>
                        setClientStatusFilter(v as ClientStatusFilter)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="inactive">Inativos</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setIsPatientFormOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Novo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <PatientsList patients={clients} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <ServicesManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Pacotes de Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <PackagesManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partnerships">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Parcerias e Descontos</CardTitle>
              </CardHeader>
              <CardContent>
                <PartnershipsManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <PatientFormDialog
        isOpen={isPatientFormOpen}
        onOpenChange={setIsPatientFormOpen}
        onPatientCreated={fetchData}
      />
      <ProfessionalFormDialog
        isOpen={isProfessionalFormOpen}
        onOpenChange={setIsProfessionalFormOpen}
        onProfessionalCreated={fetchData}
      />
    </>
  )
}

export default AdminDashboard

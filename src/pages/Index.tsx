import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Calendar, Stethoscope, Briefcase, BarChart } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Professional, Client } from '@/types'
import { getAllProfessionals } from '@/services/professionals'
import { getAllClients } from '@/services/clients'
import { UpcomingAppointments } from '@/components/admin/UpcomingAppointments'
import { ProfessionalsList } from '@/components/admin/ProfessionalsList'
import { PatientsList } from '@/components/admin/PatientsList'
import { ServicesManager } from '@/components/admin/ServicesManager'
import { AgendaView } from '@/components/admin/AgendaView'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const [profRes, clientRes] = await Promise.all([
        getAllProfessionals(),
        getAllClients(),
      ])
      if (profRes.data) setProfessionals(profRes.data)
      if (clientRes.data) setClients(clientRes.data)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-sans">
          Dashboard Administrativo
        </h1>
        <p className="text-lg text-muted-foreground">
          Bem-vindo, {user?.email || 'Administrador'}.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="overview">
            <BarChart className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="agenda">
            <Calendar className="w-4 h-4 mr-2" />
            Agenda
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
        </TabsList>

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
                    Pacientes ativos
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
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

        <TabsContent value="professionals">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Profissionais</CardTitle>
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
              <CardTitle>Gerenciar Pacientes</CardTitle>
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
      </Tabs>
    </div>
  )
}

export default AdminDashboard

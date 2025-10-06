import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardStats } from '@/components/professional/DashboardStats'
import { ClientsTable } from '@/components/professional/ClientsTable'
import { getAppointmentsByProfessional } from '@/services/appointments'
import { getClientsByProfessional } from '@/services/clients'
import { Appointment, Client } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/providers/AuthProvider'
import { Agenda } from '@/components/professional/Agenda'

const MOCK_PROFESSIONAL_ID = 'c4e6f8d0-3a4b-5c6d-7e8f-9a0b1c2d3e4f'

const ProfessionalArea = () => {
  const { toast } = useToast()
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        const [apptRes, clientRes] = await Promise.all([
          getAppointmentsByProfessional(MOCK_PROFESSIONAL_ID),
          getClientsByProfessional(MOCK_PROFESSIONAL_ID),
        ])

        if (apptRes.error) throw new Error('Erro ao buscar agendamentos.')
        if (clientRes.error) throw new Error('Erro ao buscar clientes.')

        setAppointments(apptRes.data || [])
        setClients(clientRes.data || [])
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar dados',
          description: error.message,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast, user])

  const appointmentsToday = appointments.filter((a) => {
    const today = new Date().setHours(0, 0, 0, 0)
    const apptDate = new Date(a.schedules.start_time).setHours(0, 0, 0, 0)
    return today === apptDate
  }).length

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-sans">Portal do Profissional</h1>
        <p className="text-lg text-muted-foreground">
          Gerencie sua agenda e seus pacientes.
        </p>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="schedule">Agenda</TabsTrigger>
          <TabsTrigger value="clients">Pacientes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <DashboardStats
              appointmentsToday={appointmentsToday}
              totalClients={clients.length}
              monthlyRevenue={5420.5}
            />
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <Agenda />
        </TabsContent>

        <TabsContent value="clients">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ClientsTable clients={clients} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProfessionalArea

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ClientsTable } from '@/components/professional/ClientsTable'
import { getAppointmentsByProfessional } from '@/services/appointments'
import { getClientsByProfessional } from '@/services/clients'
import { Appointment, Client } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/providers/AuthProvider'
import { Agenda } from '@/components/professional/Agenda'

const MOCK_PROFESSIONAL_ID = 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2' // Estag. David

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
        // In a real app, we'd derive professionalId from user.id
        const professionalId = MOCK_PROFESSIONAL_ID

        const [apptRes, clientRes] = await Promise.all([
          getAppointmentsByProfessional(professionalId),
          getClientsByProfessional(professionalId),
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-sans">Portal do Profissional</h1>
        <p className="text-lg text-muted-foreground">
          Gerencie sua agenda e seus pacientes.
        </p>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="schedule">Agenda</TabsTrigger>
          <TabsTrigger value="clients">Pacientes</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Agenda professionalId={MOCK_PROFESSIONAL_ID} />
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

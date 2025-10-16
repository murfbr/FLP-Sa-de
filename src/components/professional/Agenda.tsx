import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilitySettings } from './AvailabilitySettings'
import { MonthlyAgendaView } from './MonthlyAgendaView'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AgendaProps {
  professionalId: string
}

export const Agenda = ({ professionalId }: AgendaProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento da Agenda</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Diário</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="settings">Disponibilidade</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="pt-4">
            <p className="text-center text-muted-foreground">
              Visualização diária em desenvolvimento.
            </p>
          </TabsContent>
          <TabsContent value="weekly" className="pt-4">
            <p className="text-center text-muted-foreground">
              Visualização semanal em desenvolvimento.
            </p>
          </TabsContent>
          <TabsContent value="monthly" className="pt-4">
            <MonthlyAgendaView professionalId={professionalId} />
          </TabsContent>
          <TabsContent value="settings" className="pt-4">
            <AvailabilitySettings professionalId={professionalId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

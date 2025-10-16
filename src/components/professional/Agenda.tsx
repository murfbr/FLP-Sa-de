import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilitySettings } from './AvailabilitySettings'
import { MonthlyAgendaView } from './MonthlyAgendaView'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DailyAgendaView } from './DailyAgendaView'

interface AgendaProps {
  professionalId: string
}

export const Agenda = ({ professionalId }: AgendaProps) => {
  const [currentView, setCurrentView] = useState('monthly')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setCurrentView('daily')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento da Agenda</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={currentView}
          onValueChange={(value) => value && setCurrentView(value)}
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="daily">Diário</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="settings">Disponibilidade</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="pt-4">
            <DailyAgendaView
              professionalId={professionalId}
              date={selectedDate}
            />
          </TabsContent>
          <TabsContent value="weekly" className="pt-4">
            <p className="text-center text-muted-foreground">
              Visualização semanal em desenvolvimento.
            </p>
          </TabsContent>
          <TabsContent value="monthly" className="pt-4">
            <MonthlyAgendaView
              professionalId={professionalId}
              onDateSelect={handleDateSelect}
            />
          </TabsContent>
          <TabsContent value="settings" className="pt-4">
            <AvailabilitySettings professionalId={professionalId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

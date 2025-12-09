import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Client } from '@/types'
import { getClientsWithBirthdayThisWeek } from '@/services/clients'
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Cake } from 'lucide-react'

export const BirthdaysList = () => {
  const [birthdays, setBirthdays] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBirthdays = async () => {
      setIsLoading(true)
      const today = new Date()
      // Use ptBR locale to respect local week start (usually Sunday or Monday depending on config)
      const startDate = startOfWeek(today, { locale: ptBR })
      const endDate = endOfWeek(today, { locale: ptBR })

      const { data } = await getClientsWithBirthdayThisWeek(startDate, endDate)
      setBirthdays(data || [])
      setIsLoading(false)
    }
    fetchBirthdays()
  }, [])

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="w-5 h-5" />
          Aniversariantes da Semana
        </CardTitle>
        <CardDescription>
          Clientes celebrando aniversário nesta semana.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : birthdays.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum aniversariante nesta semana.
          </p>
        ) : (
          <ul className="space-y-3">
            {birthdays.map((client) => {
              if (!client.birth_date) return null
              const birthDate = parseISO(client.birth_date)
              // We need to display Day and Month.
              // We can use the birthDate object but since year is different, just formatting 'dd 'de' MMMM' works fine.
              return (
                <li
                  key={client.id}
                  className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0"
                >
                  <span className="font-medium">{client.name}</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {format(birthDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

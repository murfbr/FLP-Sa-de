import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getAppointmentsPaginated } from '@/services/appointments'
import { Appointment } from '@/types'
import { isValid } from 'date-fns'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { formatInTimeZone } from '@/lib/utils'
import { ViewMode } from './AgendaView'
import { DateRange } from 'react-day-picker'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface AgendaListViewProps {
  onAppointmentClick: (appointment: Appointment) => void
  selectedProfessional: string
  dateRange?: DateRange
  // Unused props but kept for interface compatibility
  currentDate?: Date
  onDateChange?: (date: Date) => void
  onViewChange?: (view: ViewMode) => void
  onTimeSlotClick?: (date: Date) => void
}

const PAGE_SIZE = 20

export const AgendaListView = ({
  onAppointmentClick,
  selectedProfessional,
  dateRange,
}: AgendaListViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const isMobile = useIsMobile()

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }, [selectedProfessional, dateRange])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const { data, count } = await getAppointmentsPaginated(
        currentPage,
        PAGE_SIZE,
        {
          professionalId: selectedProfessional,
          startDate: dateRange?.from,
          endDate: dateRange?.to,
        },
      )

      if (data) setAppointments(data)
      if (count !== null) setTotalCount(count)
      setIsLoading(false)
    }
    fetchData()
  }, [selectedProfessional, dateRange, currentPage])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const renderContent = () => {
    const validAppointments = appointments.filter(
      (appt) =>
        appt.schedules?.start_time &&
        isValid(new Date(appt.schedules.start_time)),
    )

    if (isLoading) {
      return <Skeleton className="h-96 w-full" />
    }
    if (validAppointments.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            Nenhum agendamento encontrado para o período selecionado.
          </p>
        </div>
      )
    }
    if (isMobile) {
      return (
        <div className="space-y-4">
          {validAppointments.map((appt) => (
            <Card
              key={appt.id}
              onClick={() => onAppointmentClick(appt)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <CardHeader>
                <CardTitle className="text-base">{appt.clients.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatInTimeZone(
                    appt.schedules.start_time,
                    "dd/MM/yyyy 'às' HH:mm",
                  )}
                </p>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>Serviço:</strong> {appt.services.name}
                </p>
                <p>
                  <strong>Profissional:</strong> {appt.professionals.name}
                </p>
                <Badge>{appt.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Data e Hora</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validAppointments.map((appt) => (
              <TableRow
                key={appt.id}
                onClick={() => onAppointmentClick(appt)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>{appt.clients.name}</TableCell>
                <TableCell>{appt.professionals.name}</TableCell>
                <TableCell>{appt.services.name}</TableCell>
                <TableCell>
                  {formatInTimeZone(
                    appt.schedules.start_time,
                    "dd/MM/yyyy 'às' HH:mm",
                  )}
                </TableCell>
                <TableCell>
                  <Badge>{appt.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {renderContent()}

      {!isLoading && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(currentPage - 1)
                }}
                className={
                  currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>

            <PaginationItem>
              <span className="text-sm px-4">
                Página {currentPage} de {totalPages}
              </span>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(currentPage + 1)
                }}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

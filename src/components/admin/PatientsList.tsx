import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Client } from '@/types'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useIsMobile } from '@/hooks/use-mobile'

interface PatientsListProps {
  patients: Client[]
}

export const PatientsList = ({ patients }: PatientsListProps) => {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const handleRowClick = (patientId: string) => {
    navigate(`/admin/pacientes/${patientId}`)
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {patients.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum paciente encontrado.
          </p>
        ) : (
          patients.map((patient) => (
            <Card
              key={patient.id}
              onClick={() => handleRowClick(patient.id)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <CardHeader>
                <CardTitle className="text-base">{patient.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{patient.email}</p>
                <p>{patient.phone || 'Não informado'}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                Nenhum paciente encontrado.
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow
                key={patient.id}
                onClick={() => handleRowClick(patient.id)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">{patient.name}</TableCell>
                <TableCell>{patient.email}</TableCell>
                <TableCell>{patient.phone || 'Não informado'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

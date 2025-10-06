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

interface PatientsListProps {
  patients: Client[]
}

export const PatientsList = ({ patients }: PatientsListProps) => {
  const navigate = useNavigate()

  const handleRowClick = (patientId: string) => {
    navigate(`/admin/pacientes/${patientId}`)
  }

  return (
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
  )
}

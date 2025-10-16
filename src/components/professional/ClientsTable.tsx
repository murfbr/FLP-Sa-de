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

interface ClientsTableProps {
  clients: Client[]
}

export const ClientsTable = ({ clients }: ClientsTableProps) => {
  const navigate = useNavigate()

  const handleRowClick = (clientId: string) => {
    navigate(`/profissional/pacientes/${clientId}`)
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
        {clients.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center">
              Nenhum cliente encontrado.
            </TableCell>
          </TableRow>
        )}
        {clients.map((client) => (
          <TableRow
            key={client.id}
            onClick={() => handleRowClick(client.id)}
            className="cursor-pointer hover:bg-muted/50"
          >
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell>{client.email}</TableCell>
            <TableCell>{client.phone || 'Não informado'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

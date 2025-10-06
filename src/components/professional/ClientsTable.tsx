import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Client } from '@/types'

interface ClientsTableProps {
  clients: Client[]
}

export const ClientsTable = ({ clients }: ClientsTableProps) => {
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
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell>{client.email}</TableCell>
            <TableCell>{client.phone || 'Não informado'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

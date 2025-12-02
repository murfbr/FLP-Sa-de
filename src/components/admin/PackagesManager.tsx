import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'
import { Package } from '@/types'
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} from '@/services/packages'
import { PackageFormDialog } from './PackageFormDialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const PackagesManager = () => {
  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | undefined>(
    undefined,
  )
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const fetchPackages = async () => {
    setIsLoading(true)
    const { data } = await getPackages()
    setPackages(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  const handleFormSubmit = async (values: any) => {
    setIsSubmitting(true)
    const promise = editingPackage
      ? updatePackage(editingPackage.id, values)
      : createPackage(values)

    const { error } = await promise
    if (error) {
      toast({ title: 'Erro ao salvar pacote', variant: 'destructive' })
    } else {
      toast({
        title: `Pacote ${editingPackage ? 'atualizado' : 'criado'} com sucesso!`,
      })
      setIsDialogOpen(false)
      setEditingPackage(undefined)
      fetchPackages()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (packageId: string) => {
    const { error } = await deletePackage(packageId)
    if (error) {
      toast({
        title: 'Erro ao excluir pacote',
        description: error.message.includes('violates foreign key')
          ? 'Não é possível excluir este pacote pois existem clientes associados a ele.'
          : error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Pacote excluído com sucesso!' })
      fetchPackages()
    }
  }

  const openCreateDialog = () => {
    setEditingPackage(undefined)
    setIsDialogOpen(true)
  }

  const openEditDialog = (pkg: Package) => {
    setEditingPackage(pkg)
    setIsDialogOpen(true)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Pacote
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : packages.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhum pacote cadastrado.
        </p>
      ) : isMobile ? (
        <div className="space-y-4">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <CardTitle className="text-base">{pkg.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  <strong>Serviço:</strong> {pkg.services?.name || '-'}
                </p>
                <p>
                  <strong>Sessões:</strong> {pkg.session_count}
                </p>
                <p>
                  <strong>Preço:</strong> {formatCurrency(pkg.price)}
                </p>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(pkg)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Pacote?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(pkg.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Serviço Associado</TableHead>
              <TableHead>Sessões</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell>{pkg.services?.name || '-'}</TableCell>
                <TableCell>{pkg.session_count}</TableCell>
                <TableCell>{formatCurrency(pkg.price)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(pkg)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Pacote?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(pkg.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <PackageFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleFormSubmit}
        defaultValues={editingPackage}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

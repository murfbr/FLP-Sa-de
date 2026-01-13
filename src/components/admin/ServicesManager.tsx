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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { ServiceForm } from './ServiceForm'
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from '@/services/services'
import { Service } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { PlusCircle, Edit, Trash2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const ServicesManager = () => {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const fetchServices = async () => {
    setIsLoading(true)
    const { data } = await getServices()
    setServices(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleFormSubmit = async (values: Omit<Service, 'id'>) => {
    setIsSubmitting(true)
    const promise = editingService
      ? updateService(editingService.id, values)
      : createService(values)

    const { error } = await promise
    if (error) {
      toast({
        title: 'Erro ao salvar serviço',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: `Serviço ${editingService ? 'atualizado' : 'criado'} com sucesso!`,
      })
      setIsDialogOpen(false)
      setEditingService(null)
      fetchServices()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (serviceId: string) => {
    const { error } = await deleteService(serviceId)
    if (error) {
      toast({ title: 'Erro ao excluir serviço', variant: 'destructive' })
    } else {
      toast({ title: 'Serviço excluído com sucesso!' })
      fetchServices()
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  const renderMobileView = () => (
    <div className="space-y-4">
      {services.map((service) => (
        <Card key={service.id}>
          <CardHeader>
            <CardTitle className="text-base flex justify-between items-center">
              {service.name}
              <Badge variant="outline" className="w-fit ml-2">
                {service.value_type === 'session' ? 'Sessão' : 'Mensal'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>Duração:</strong> {service.duration_minutes} min
            </p>
            <p>
              <strong>Preço:</strong> {formatCurrency(service.price)}
            </p>
            <p className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <strong>Max. Participantes:</strong> {service.max_attendees}
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditingService(service)
                  setIsDialogOpen(true)
                }}
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
                    <AlertDialogTitle>
                      Tem certeza que deseja excluir?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá
                      permanentemente o serviço.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(service.id)}>
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
  )

  const renderDesktopView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Max. Part.</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {service.value_type === 'session' ? 'Sessão' : 'Mensal'}
                </Badge>
              </TableCell>
              <TableCell>{service.duration_minutes} min</TableCell>
              <TableCell>{formatCurrency(service.price)}</TableCell>
              <TableCell>{service.max_attendees}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingService(service)
                    setIsDialogOpen(true)
                  }}
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
                      <AlertDialogTitle>
                        Tem certeza que deseja excluir?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá
                        permanentemente o serviço.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(service.id)}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
          {services.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                Nenhum serviço cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingService(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
            </DialogHeader>
            <ServiceForm
              onSubmit={handleFormSubmit}
              defaultValues={editingService || {}}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        renderMobileView()
      ) : (
        renderDesktopView()
      )}
    </div>
  )
}

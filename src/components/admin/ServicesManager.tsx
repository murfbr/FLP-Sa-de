import { useState, useEffect } from 'react'
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
import { PackageFormDialog } from './PackageFormDialog'
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from '@/services/services'
import {
  createPackage,
  updatePackage,
  deletePackage,
} from '@/services/packages'
import { Service, Package } from '@/types'
import { useToast } from '@/hooks/use-toast'
import {
  PlusCircle,
  Edit,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  Package as PackageIcon,
  Tag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export const ServicesManager = () => {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Service Dialogs
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  // Package Dialogs
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | undefined>(
    undefined,
  )
  const [selectedServiceId, setSelectedServiceId] = useState<
    string | undefined
  >(undefined)

  const [expandedServices, setExpandedServices] = useState<string[]>([])

  const { toast } = useToast()

  const fetchServices = async () => {
    setIsLoading(true)
    const { data } = await getServices()
    setServices(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const toggleServiceExpand = (serviceId: string) => {
    setExpandedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    )
  }

  // --- Service Actions ---

  const handleServiceSubmit = async (values: Omit<Service, 'id'>) => {
    setIsSubmitting(true)
    const promise = editingService
      ? updateService(editingService.id, values)
      : createService(values)

    const { error } = await promise
    if (error) {
      toast({
        title: 'Erro ao salvar serviço',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: `Serviço ${editingService ? 'atualizado' : 'criado'} com sucesso!`,
      })
      setIsServiceDialogOpen(false)
      setEditingService(null)
      fetchServices()
    }
    setIsSubmitting(false)
  }

  const handleServiceDelete = async (serviceId: string) => {
    const { error } = await deleteService(serviceId)
    if (error) {
      toast({
        title: 'Erro ao excluir serviço',
        description: error.message.includes('foreign key')
          ? 'Não é possível excluir pois existem pacotes ou agendamentos vinculados.'
          : error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Serviço excluído com sucesso!' })
      fetchServices()
    }
  }

  // --- Package Actions ---

  const handleOpenPackageDialog = (
    serviceId: string,
    pkg?: Package,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation()
    setSelectedServiceId(serviceId)
    setEditingPackage(pkg)
    setIsPackageDialogOpen(true)
  }

  const handlePackageSubmit = async (values: any) => {
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
      setIsPackageDialogOpen(false)
      setEditingPackage(undefined)
      setSelectedServiceId(undefined)
      fetchServices()
    }
    setIsSubmitting(false)
  }

  const handlePackageDelete = async (packageId: string) => {
    const { error } = await deletePackage(packageId)
    if (error) {
      toast({
        title: 'Erro ao excluir pacote',
        description: error.message.includes('foreign key')
          ? 'Não é possível excluir pois existem clientes associados.'
          : error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Pacote excluído com sucesso!' })
      fetchServices()
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Catálogo de Serviços e Pacotes</h3>
        <Dialog
          open={isServiceDialogOpen}
          onOpenChange={(open) => {
            setIsServiceDialogOpen(open)
            if (!open) setEditingService(null)
          }}
        >
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
              onSubmit={handleServiceSubmit}
              defaultValues={editingService || {}}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
          Nenhum serviço cadastrado. Comece adicionando um serviço.
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <Collapsible
              key={service.id}
              open={expandedServices.includes(service.id)}
              onOpenChange={() => toggleServiceExpand(service.id)}
            >
              <Card>
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                          {expandedServices.includes(service.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </CollapsibleTrigger>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {service.name}
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {service.value_type === 'session'
                              ? 'Sessão'
                              : 'Mensal'}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {service.price > 0 ? (
                              formatCurrency(service.price)
                            ) : (
                              <span className="text-orange-600 font-medium text-xs bg-orange-100 px-1 rounded">
                                Venda por Pacotes
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Max. {service.max_attendees}
                          </span>
                          <span>• {service.duration_minutes} min</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {service.value_type === 'session' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) =>
                            handleOpenPackageDialog(service.id, undefined, e)
                          }
                          className="hidden sm:flex"
                        >
                          <PackageIcon className="mr-2 h-3.5 w-3.5" />
                          Add Pacote
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingService(service)
                          setIsServiceDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Excluir Serviço?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá o
                              serviço e todos os pacotes associados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleServiceDelete(service.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 pl-16 pr-4 bg-muted/10 border-t">
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          <PackageIcon className="w-4 h-4" />
                          Pacotes Disponíveis
                        </h4>
                        {service.value_type === 'session' && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={(e) =>
                              handleOpenPackageDialog(service.id, undefined, e)
                            }
                            className="sm:hidden h-auto p-0"
                          >
                            + Add Pacote
                          </Button>
                        )}
                      </div>

                      {service.packages && service.packages.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {service.packages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className="bg-background rounded-md border p-3 shadow-sm flex flex-col justify-between"
                            >
                              <div>
                                <div className="font-medium text-sm">
                                  {pkg.name}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {pkg.session_count} sessões
                                </div>
                              </div>
                              <div className="flex items-end justify-between mt-3">
                                <div className="font-semibold text-sm">
                                  {formatCurrency(pkg.price)}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) =>
                                      handleOpenPackageDialog(
                                        service.id,
                                        pkg,
                                        e,
                                      )
                                    }
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Excluir Pacote?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handlePackageDelete(pkg.id)
                                          }
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Nenhum pacote configurado para este serviço.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      <PackageFormDialog
        isOpen={isPackageDialogOpen}
        onOpenChange={setIsPackageDialogOpen}
        onSubmit={handlePackageSubmit}
        defaultValues={editingPackage}
        isSubmitting={isSubmitting}
        fixedServiceId={selectedServiceId}
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createClientSubscription } from '@/services/clients'
import { getServices } from '@/services/services'
import { Service } from '@/types'
import { format } from 'date-fns'

const subscriptionSchema = z.object({
  serviceId: z.string().uuid('Selecione um serviço.'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data inválida',
  }),
})

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>

interface ClientSubscriptionDialogProps {
  clientId: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubscriptionCreated: () => void
}

export const ClientSubscriptionDialog = ({
  clientId,
  isOpen,
  onOpenChange,
  onSubscriptionCreated,
}: ClientSubscriptionDialogProps) => {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      startDate: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  useEffect(() => {
    if (isOpen) {
      getServices().then(({ data }) => {
        // Filter for monthly services only
        const monthlyServices =
          data?.filter((s) => s.value_type === 'monthly') || []
        setServices(monthlyServices)
      })
    }
  }, [isOpen])

  const onSubmit = async (values: SubscriptionFormValues) => {
    setIsSubmitting(true)
    const { error } = await createClientSubscription({
      client_id: clientId,
      service_id: values.serviceId,
      start_date: new Date(values.startDate).toISOString(),
      end_date: null, // Could add field for this later if needed
      status: 'active',
    })

    if (error) {
      toast({
        title: 'Erro ao criar assinatura',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Assinatura criada com sucesso!' })
      onSubscriptionCreated()
      onOpenChange(false)
      form.reset({ startDate: format(new Date(), 'yyyy-MM-dd') })
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Assinatura Mensal</DialogTitle>
          <DialogDescription>
            Ative um serviço mensal para o paciente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço Mensal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.length > 0 ? (
                        services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} - R$ {s.price.toFixed(2)}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhum serviço mensal cadastrado.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Ativar Assinatura'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

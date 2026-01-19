import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Package, Service } from '@/types'
import { getServices } from '@/services/services'

const packageSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
  service_id: z.string().uuid('Selecione um serviço.'),
  session_count: z.coerce
    .number()
    .int()
    .positive('O número de sessões deve ser positivo.'),
  price: z.coerce.number().positive('O preço deve ser positivo.'),
})

type PackageFormValues = z.infer<typeof packageSchema>

interface PackageFormProps {
  onSubmit: (values: PackageFormValues) => void
  defaultValues?: Partial<Package>
  isSubmitting: boolean
  fixedServiceId?: string
}

export const PackageForm = ({
  onSubmit,
  defaultValues,
  isSubmitting,
  fixedServiceId,
}: PackageFormProps) => {
  const [services, setServices] = useState<Service[]>([])

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      service_id: fixedServiceId || defaultValues?.service_id || '',
      session_count: defaultValues?.session_count || 1,
      price: defaultValues?.price || 0,
    },
  })

  useEffect(() => {
    getServices().then(({ data }) => {
      // Filter only 'session' type services, as monthly services are handled via subscription
      const sessionServices =
        data?.filter((s) => s.value_type === 'session') || []
      setServices(sessionServices)
    })
  }, [])

  useEffect(() => {
    if (fixedServiceId) {
      form.setValue('service_id', fixedServiceId)
    }
  }, [fixedServiceId, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Pacote</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Pacote 10 Sessões" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o pacote..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="service_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço Associado</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
                disabled={!!fixedServiceId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="session_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade de Sessões</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço Total (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Salvando...' : 'Salvar Pacote'}
        </Button>
      </form>
    </Form>
  )
}

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
  FormDescription,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Service } from '@/types'

const serviceSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
  duration_minutes: z.coerce
    .number()
    .int()
    .positive('A duração deve ser um número positivo.'),
  price: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
  value_type: z.enum(['session', 'monthly']),
  max_attendees: z.coerce
    .number()
    .int()
    .positive('O número máximo de participantes deve ser pelo menos 1.')
    .default(1),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  onSubmit: (values: ServiceFormValues) => void
  defaultValues?: Partial<Service>
  isSubmitting: boolean
}

export const ServiceForm = ({
  onSubmit,
  defaultValues,
  isSubmitting,
}: ServiceFormProps) => {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      duration_minutes: defaultValues?.duration_minutes || 60,
      price: defaultValues?.price || 0,
      value_type: defaultValues?.value_type || 'session',
      max_attendees: defaultValues?.max_attendees || 1,
    },
  })

  const priceValue = form.watch('price')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Serviço</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fisioterapia Ortopédica" {...field} />
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
                  placeholder="Descreva o serviço..."
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
          name="value_type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Valor</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="session" />
                    </FormControl>
                    <FormLabel className="font-normal">Por Sessão</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="monthly" />
                    </FormControl>
                    <FormLabel className="font-normal">Mensal</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Serviços "Por Sessão" podem ser vendidos individualmente ou em
                pacotes. Serviços "Mensal" requerem assinatura ativa do cliente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (minutos)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
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
                <FormLabel>Preço Avulso (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>
                  {priceValue === 0
                    ? 'Preço 0 indica venda exclusiva por pacotes.'
                    : 'Valor cobrado por sessão avulsa.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="max_attendees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max. Participantes</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Salvando...' : 'Salvar Serviço'}
        </Button>
      </form>
    </Form>
  )
}

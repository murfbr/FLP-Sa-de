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
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Partnership } from '@/types'
import { createClient } from '@/services/clients'
import { getAllPartnerships } from '@/services/partnerships'
import { Skeleton } from '../ui/skeleton'

const patientSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Por favor, insira um email válido.'),
  phone: z.string().optional(),
  partnership_id: z.string().uuid().nullable().optional(),
})

type PatientFormValues = z.infer<typeof patientSchema>

interface PatientFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onPatientCreated: () => void
}

export const PatientFormDialog = ({
  isOpen,
  onOpenChange,
  onPatientCreated,
}: PatientFormDialogProps) => {
  const { toast } = useToast()
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      partnership_id: null,
    },
  })

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      getAllPartnerships().then(({ data }) => {
        setPartnerships(data || [])
        setIsLoading(false)
      })
    }
  }, [isOpen])

  const onSubmit = async (values: PatientFormValues) => {
    setIsSubmitting(true)
    const { error } = await createClient({
      ...values,
      partnership_id: values.partnership_id || null,
    })

    if (error) {
      toast({
        title: 'Erro ao criar paciente',
        description: error.message.includes('duplicate key')
          ? 'Um paciente com este email já existe.'
          : error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Paciente criado com sucesso!' })
      onPatientCreated()
      onOpenChange(false)
      form.reset()
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) form.reset()
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar um novo paciente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do paciente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partnership_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parceria (Opcional)</FormLabel>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === 'none' ? null : value)
                      }
                      defaultValue={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma parceria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {partnerships.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? 'Salvando...' : 'Salvar Paciente'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

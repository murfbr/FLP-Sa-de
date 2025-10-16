import { useEffect, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Client } from '@/types'
import { updateClient } from '@/services/clients'

const patientSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Por favor, insira um email válido.'),
  phone: z.string().optional(),
})

type PatientFormValues = z.infer<typeof patientSchema>

interface PatientEditDialogProps {
  patient: Client | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onPatientUpdated: (updatedPatient: Client) => void
}

export const PatientEditDialog = ({
  patient,
  isOpen,
  onOpenChange,
  onPatientUpdated,
}: PatientEditDialogProps) => {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  })

  useEffect(() => {
    if (patient) {
      form.reset({
        name: patient.name,
        email: patient.email,
        phone: patient.phone || '',
      })
    }
  }, [patient, form, isOpen])

  const onSubmit = async (values: PatientFormValues) => {
    if (!patient) return
    setIsSubmitting(true)

    const { data, error } = await updateClient(patient.id, values)

    if (error) {
      toast({
        title: 'Erro ao atualizar paciente',
        description: error.message,
        variant: 'destructive',
      })
    } else if (data) {
      toast({ title: 'Paciente atualizado com sucesso!' })
      onPatientUpdated(data)
      onOpenChange(false)
    }
    setIsSubmitting(false)
  }

  if (!patient) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
          <DialogDescription>
            Atualize as informações de {patient.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input type="email" {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

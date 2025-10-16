import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Professional } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { updateProfessional } from '@/services/professionals'
import { uploadFile, getPublicUrl } from '@/services/storage'

const professionalSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  specialty: z.string().optional(),
  bio: z.string().optional(),
})

type ProfessionalFormValues = z.infer<typeof professionalSchema>

interface ProfessionalEditDialogProps {
  professional: Professional
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onProfessionalUpdate: (updatedProfessional: Professional) => void
}

export const ProfessionalEditDialog = ({
  professional,
  isOpen,
  onOpenChange,
  onProfessionalUpdate,
}: ProfessionalEditDialogProps) => {
  const { toast } = useToast()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    values: {
      name: professional.name,
      specialty: professional.specialty || '',
      bio: professional.bio || '',
    },
  })

  const onSubmit = async (values: ProfessionalFormValues) => {
    setIsSubmitting(true)
    let avatar_url = professional.avatar_url

    if (avatarFile) {
      const filePath = `avatars/${professional.id}/${avatarFile.name}`
      const { error: uploadError } = await uploadFile(
        'avatars',
        filePath,
        avatarFile,
      )
      if (uploadError) {
        toast({ title: 'Erro no upload do avatar', variant: 'destructive' })
        setIsSubmitting(false)
        return
      }
      avatar_url = getPublicUrl('avatars', filePath)
    }

    const { data, error } = await updateProfessional(professional.id, {
      ...values,
      avatar_url,
    })

    if (error) {
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' })
    } else if (data) {
      toast({ title: 'Perfil atualizado com sucesso!' })
      onProfessionalUpdate(data)
      onOpenChange(false)
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil do Profissional</DialogTitle>
          <DialogDescription>
            Atualize as informações de {professional.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografia</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Foto de Perfil</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setAvatarFile(e.target.files ? e.target.files[0] : null)
                  }
                />
              </FormControl>
            </FormItem>
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

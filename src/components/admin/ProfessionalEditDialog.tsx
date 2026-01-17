import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useNavigate } from 'react-router-dom'
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
  FormDescription,
} from '@/components/ui/form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  updateProfessional,
  deleteProfessional,
} from '@/services/professionals'
import { uploadFile, getPublicUrl } from '@/services/storage'
import { useAuth } from '@/providers/AuthProvider'
import { AlertTriangle, Trash2 } from 'lucide-react'

const professionalSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  is_active: z.boolean().default(true),
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
  const { role } = useAuth()
  const navigate = useNavigate()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const isAdmin = role === 'admin'

  const form = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    values: {
      name: professional.name,
      specialty: professional.specialty || '',
      bio: professional.bio || '',
      is_active: professional.is_active ?? true,
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

  const handleDelete = async () => {
    setIsSubmitting(true)
    const { error } = await deleteProfessional(professional.id)
    if (error) {
      toast({
        title: 'Erro ao excluir profissional',
        description: 'Verifique se existem agendamentos ou vínculos pendentes.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
      setShowDeleteAlert(false)
    } else {
      toast({ title: 'Profissional excluído com sucesso.' })
      setShowDeleteAlert(false)
      onOpenChange(false)
      navigate('/admin')
    }
  }

  return (
    <>
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

              {isAdmin && (
                <div className="space-y-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Status do Profissional
                          </FormLabel>
                          <FormDescription>
                            Define se o profissional está ativo na plataforma.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteAlert(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Profissional
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Profissional
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o profissional{' '}
              <span className="font-semibold">{professional.name}</span>? Esta
              ação não pode ser desfeita e removerá todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

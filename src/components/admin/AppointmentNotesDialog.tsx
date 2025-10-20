import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { updateAppointmentNotes } from '@/services/appointments'
import { Appointment } from '@/types'

interface AppointmentNotesDialogProps {
  appointment: Appointment | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onNoteSave: () => void
}

export const AppointmentNotesDialog = ({
  appointment,
  isOpen,
  onOpenChange,
  onNoteSave,
}: AppointmentNotesDialogProps) => {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (appointment) {
      setNotes(appointment.notes || '')
    }
  }, [appointment, isOpen])

  const handleSave = async () => {
    if (!appointment) return
    setIsSubmitting(true)
    const { error } = await updateAppointmentNotes(appointment.id, notes)
    if (error) {
      toast({ title: 'Erro ao salvar anotações', variant: 'destructive' })
    } else {
      toast({ title: 'Anotações salvas com sucesso!' })
      onNoteSave()
      onOpenChange(false)
    }
    setIsSubmitting(false)
  }

  if (!appointment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Prontuário da Sessão</DialogTitle>
          <DialogDescription>
            Adicione ou edite as anotações para a sessão de{' '}
            {appointment.clients?.name || 'Cliente Desconhecido'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Anotações
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3 h-32"
              placeholder="Digite as anotações da sessão aqui..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Anotações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

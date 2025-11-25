import { useState } from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { addAppointmentNote } from '@/services/appointments'
import { Appointment, NoteEntry } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Send } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'

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
  const [newNote, setNewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleSave = async () => {
    if (!appointment || !newNote.trim()) return
    setIsSubmitting(true)

    const noteEntry: NoteEntry = {
      date: new Date().toISOString(),
      professional_name: user?.email || 'Administrador', // Admins might not have a professional profile
      content: newNote,
    }

    const { error } = await addAppointmentNote(appointment.id, noteEntry)
    if (error) {
      toast({ title: 'Erro ao salvar anotação', variant: 'destructive' })
    } else {
      toast({ title: 'Anotação adicionada com sucesso!' })
      setNewNote('')
      onNoteSave()
      // We don't close the dialog immediately to allow adding more notes or viewing the result
    }
    setIsSubmitting(false)
  }

  if (!appointment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Prontuário da Sessão</DialogTitle>
          <DialogDescription>
            Histórico de anotações para a sessão de{' '}
            {appointment.clients?.name || 'Cliente Desconhecido'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Histórico</Label>
            <ScrollArea className="h-[250px] w-full rounded-md border p-4 bg-muted/20">
              {appointment.notes && appointment.notes.length > 0 ? (
                <div className="space-y-4">
                  {appointment.notes.map((note, index) => (
                    <div
                      key={index}
                      className="bg-background p-3 rounded-lg border shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-xs text-primary">
                          {note.professional_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.date), "dd/MM/yy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Nenhuma anotação registrada para esta sessão.
                </p>
              )}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-note">Nova Anotação</Label>
            <div className="flex gap-2">
              <Textarea
                id="new-note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[80px]"
                placeholder="Digite uma nova anotação..."
              />
              <Button
                size="icon"
                className="h-auto self-end"
                onClick={handleSave}
                disabled={isSubmitting || !newNote.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

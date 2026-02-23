import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

export function PWAPrompt() {
  const { toast } = useToast()

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] SW Registered:', r)
    },
    onRegisterError(error) {
      console.error('[PWA] SW registration error:', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      toast({
        title: 'Nova versão disponível',
        description:
          'Uma nova versão do sistema está disponível. Atualize para continuar.',
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateServiceWorker(true)}
          >
            Recarregar
          </Button>
        ),
      })
    }
  }, [needRefresh, toast, updateServiceWorker])

  return null
}

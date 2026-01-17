import { ReactNode, useEffect, useState, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { UserRole } from '@/types'
import { Loader2, LogOut, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

const REDIRECT_GRACE_PERIOD_MS = 1500

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: ProtectedRouteProps) => {
  const { user, role, loading, signOut } = useAuth()
  const location = useLocation()

  const [showLongLoadingMessage, setShowLongLoadingMessage] = useState(false)
  const [isVerifyingSession, setIsVerifyingSession] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  const graceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (loading) {
      timer = setTimeout(() => {
        setShowLongLoadingMessage(true)
      }, 2000)
    } else {
      setShowLongLoadingMessage(false)
    }
    return () => clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    if (!loading && !user) {
      setIsVerifyingSession(true)
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current)

      graceTimerRef.current = setTimeout(() => {
        console.log('[AuthDebug] Grace period expired. Redirecting to login.')
        setShouldRedirect(true)
        setIsVerifyingSession(false)
      }, REDIRECT_GRACE_PERIOD_MS)
    } else if (user) {
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current)
      setIsVerifyingSession(false)
      setShouldRedirect(false)
    }

    return () => {
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current)
    }
  }, [loading, user])

  // 1. Loading State
  if (loading || isVerifyingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-6 p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse text-sm text-center">
            {isVerifyingSession ? (
              'Verificando sessão...'
            ) : showLongLoadingMessage ? (
              <span className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />A conexão está lenta,
                aguarde...
              </span>
            ) : (
              'Carregando informações...'
            )}
          </p>
        </div>

        <div className="mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  // 2. Authentication Check
  if (!user || shouldRedirect) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Role Authorization Check
  if (allowedRoles) {
    // If role is null here (and not loading), it means we have a user but failed to fetch role (and didn't default)
    // Or user is in a strange state. We should not allow access to protected routes.
    if (!role) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Erro de Perfil</h2>
          <p className="text-muted-foreground mb-6">
            Não foi possível carregar as informações do seu perfil.
            <br />
            Por favor, tente recarregar a página ou faça login novamente.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()}>Recarregar</Button>
            <Button variant="outline" onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        </div>
      )
    }

    if (!allowedRoles.includes(role)) {
      return <Navigate to="/access-denied" replace />
    }
  }

  // 4. Render Authorized Content
  return <>{children}</>
}

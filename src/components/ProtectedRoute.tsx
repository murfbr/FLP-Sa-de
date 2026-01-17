import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { UserRole } from '@/lib/supabase/types'
import {
  Loader2,
  LogOut,
  AlertTriangle,
  RefreshCw,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: ProtectedRouteProps) => {
  const { user, role, loading, signOut } = useAuth()
  const location = useLocation()

  const [showLongLoadingMessage, setShowLongLoadingMessage] = useState(false)
  const [showRetryOption, setShowRetryOption] = useState(false)
  const [isTimedOut, setIsTimedOut] = useState(false)

  useEffect(() => {
    let timer1: NodeJS.Timeout
    let timer2: NodeJS.Timeout
    let timer3: NodeJS.Timeout

    if (loading) {
      // 1. Show "waiting" message after 2 seconds
      timer1 = setTimeout(() => setShowLongLoadingMessage(true), 2000)

      // 2. Show retry/logout buttons after 6 seconds (slightly increased for retry logic in provider)
      timer2 = setTimeout(() => setShowRetryOption(true), 6000)

      // 3. Force timeout state after 15 seconds (Fail-safe for network issues)
      timer3 = setTimeout(() => setIsTimedOut(true), 15000)
    } else {
      setShowLongLoadingMessage(false)
      setShowRetryOption(false)
      setIsTimedOut(false)
    }

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [loading])

  const handleForceLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  // 1. Loading State (and Timeout Handling)
  if (loading || isTimedOut) {
    // If timed out, show error instead of spinner
    if (isTimedOut) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 animate-fade-in">
          <div className="w-full max-w-md space-y-4">
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>Problema de Conexão</AlertTitle>
              <AlertDescription>
                Não foi possível carregar seu perfil. Isso geralmente ocorre
                devido a instabilidade na internet ou bloqueio de rede.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button onClick={handleForceLogout} variant="destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Normal loading spinner
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-6 p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="space-y-2">
            <p className="text-muted-foreground animate-pulse text-sm">
              {showLongLoadingMessage ? (
                <span className="flex items-center justify-center gap-2 text-orange-600 font-medium">
                  Conectando ao servidor...
                </span>
              ) : (
                'Verificando credenciais...'
              )}
            </p>
            {showLongLoadingMessage && (
              <p className="text-xs text-muted-foreground max-w-[250px]">
                Estamos tentando sincronizar seus dados. Aguarde um momento.
              </p>
            )}
          </div>

          {(showLongLoadingMessage || showRetryOption) && (
            <div className="flex flex-col gap-3 mt-4 animate-fade-in-up items-center min-w-[200px]">
              {showRetryOption && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Recarregar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 2. Authentication Check
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Role Integrity Check
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Erro de Perfil</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Seu usuário foi autenticado, mas não conseguimos identificar seu nível
          de acesso.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button variant="outline" onClick={handleForceLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    )
  }

  // 4. Role Authorization Check
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/access-denied" replace />
  }

  // 5. Render Authorized Content
  return <>{children}</>
}

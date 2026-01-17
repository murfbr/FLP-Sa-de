import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { UserRole } from '@/lib/supabase/types'
import { Loader2, LogOut, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  useEffect(() => {
    let timer1: NodeJS.Timeout
    let timer2: NodeJS.Timeout

    if (loading) {
      // Show "waiting" message after 2 seconds
      timer1 = setTimeout(() => {
        setShowLongLoadingMessage(true)
      }, 2000)

      // Show retry button after 7 seconds (providing early exit option before 10s strict timeout)
      timer2 = setTimeout(() => {
        setShowRetryOption(true)
      }, 7000)
    } else {
      setShowLongLoadingMessage(false)
      setShowRetryOption(false)
    }

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [loading])

  const handleForceLogout = async () => {
    await signOut()
    // Optional: Force reload to clear any stuck memory state
    window.location.href = '/login'
  }

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-6 p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse text-sm text-center">
            {showLongLoadingMessage ? (
              <span className="flex items-center gap-2 text-orange-600 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Verificando credenciais...
              </span>
            ) : (
              'Carregando informações...'
            )}
          </p>
          {showRetryOption && (
            <div className="flex flex-col gap-3 mt-4 animate-fade-in-up items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="w-full min-w-[160px]"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Recarregar Página
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs hover:text-destructive transition-colors"
                onClick={handleForceLogout}
              >
                Cancelar e Sair
              </Button>
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
  // If we have a user but no role (and not loading), it means fetching profile failed or profile missing.
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Perfil não Encontrado</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Não foi possível recuperar suas informações de perfil. Isso pode
          ocorrer devido a uma falha de conexão ou erro no cadastro.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button variant="outline" onClick={handleForceLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair da Conta
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

import { ReactNode, useEffect, useState, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { UserRole } from '@/types'
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

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-6 p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse text-sm text-center">
            {showLongLoadingMessage ? (
              <span className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />A conexão está lenta,
                aguarde...
              </span>
            ) : (
              'Carregando informações...'
            )}
          </p>
        </div>
      </div>
    )
  }

  // 2. Authentication Check
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Role Integrity Check
  // If we have a user but no role (and not loading), it means fetching profile failed.
  // We cannot allow access to protected routes without a known role.
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro de Perfil</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Não foi possível carregar as informações do seu perfil. Isso pode
          ocorrer devido a uma falha de conexão.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
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

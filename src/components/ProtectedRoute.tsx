import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { UserRole } from '@/types'
import { Loader2, LogOut } from 'lucide-react'
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

  useEffect(() => {
    if (loading) {
      console.log('[AuthDebug] ProtectedRoute: Auth is loading...')
    } else if (!user) {
      console.log(
        '[AuthDebug] ProtectedRoute: No user found, redirecting to login. Location:',
        location.pathname,
      )
    } else if (allowedRoles && role && !allowedRoles.includes(role)) {
      console.log(
        `[AuthDebug] ProtectedRoute: Access denied for role ${role} at ${location.pathname}`,
      )
    } else {
      console.log(
        `[AuthDebug] ProtectedRoute: Access granted to ${location.pathname} for ${user?.email} (${role})`,
      )
    }
  }, [loading, user, role, location, allowedRoles])

  // 1. Loading State
  // Blocks rendering until we are sure about auth state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse text-sm text-center px-4">
            Verificando credenciais e carregando perfil...
          </p>
        </div>

        {/* Global Emergency Logout - Functional even during loading */}
        <div className="mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cancelar e Sair
          </Button>
        </div>
      </div>
    )
  }

  // 2. Authentication Check
  if (!user) {
    // Redirect to login, preserving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Role Authorization Check
  if (allowedRoles && role) {
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/access-denied" replace />
    }
  }

  // 4. Render Authorized Content
  return <>{children}</>
}

import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  // 1. Loading State - Display a full-screen centered loader
  // This provides immediate feedback while session is being verified
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse text-sm">
          Carregando aplicação...
        </p>
      </div>
    )
  }

  // 2. Unauthenticated Redirect
  // Immediate redirection if no user is found after loading
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Role verification (only if authenticated)
  // Ensure user has one of the allowed roles if specified
  if (allowedRoles) {
    // If role is available and not in the allowed list, deny access
    if (role && !allowedRoles.includes(role)) {
      return <Navigate to="/access-denied" replace />
    }
  }

  // Render children (Layout or Page) only when authentication is confirmed
  return <>{children}</>
}

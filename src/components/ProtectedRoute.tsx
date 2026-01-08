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

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-background space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Verificando sessão...
        </p>
      </div>
    )
  }

  // 2. Unauthenticated Redirect
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Role verification (only if authenticated)
  if (allowedRoles) {
    // If role is null but user exists (edge case, e.g. profile creation delayed),
    // we should might wait or fallback. AuthProvider defaults role to 'client' mostly.
    // If role is strictly not in allowed list:
    if (role && !allowedRoles.includes(role)) {
      return <Navigate to="/access-denied" replace />
    }
  }

  return <>{children}</>
}

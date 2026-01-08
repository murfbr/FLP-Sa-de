import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Carregando...</p>
        <div className="container max-w-md space-y-3 p-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    )
  }

  // 2. Unauthenticated Redirect
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Role verification (only if authenticated)
  // If no allowedRoles specified, assume allow all authenticated (or restrict based on role logic downstream)
  // However, usually we want to block access if role is not loaded yet (should be handled by loading)
  // or if role is strictly invalid.

  if (allowedRoles) {
    if (!role) {
      // Role should be loaded if user is authenticated and loading is false.
      // If null, it means profile fetch failed or no profile.
      // Fallback to denying access or showing error.
      return <Navigate to="/access-denied" replace />
    }

    if (!allowedRoles.includes(role)) {
      return <Navigate to="/access-denied" replace />
    }
  }

  return <>{children}</>
}

import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          <Skeleton className="h-64 w-full" />
          <div className="md:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user is authenticated but role is somehow missing (error state),
  // treat as client/restricted to avoid infinite loops or black screens.
  // Or if strictly 'client'.
  if (!role || role === 'client') {
    return <Navigate to="/cliente-indisponivel" replace />
  }

  return <>{children}</>
}

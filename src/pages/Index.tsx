import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'
import AdminDashboard from './AdminDashboard'

const Index = () => {
  const { role, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && role) {
      if (role === 'professional') {
        navigate('/profissional', { replace: true })
      }
    }
  }, [role, loading, navigate])

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

  // If role is professional, we return null or skeleton while redirect happens
  if (role === 'professional') {
    return (
      <div className="container mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    )
  }

  // Ensure only admin sees the dashboard here.
  // If role is unknown or unexpected (not admin, not professional), handle gracefully.
  if (role !== 'admin') {
    // This case theoretically shouldn't be reached if ProtectedRoute is doing its job for 'client'
    // But if 'role' is something else or null, we might want to fallback.
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-center text-muted-foreground">
          Permissão insuficiente ou erro ao carregar perfil.
        </p>
      </div>
    )
  }

  return <AdminDashboard />
}

export default Index

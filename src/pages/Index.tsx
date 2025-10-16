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

  if (loading || role !== 'admin') {
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

  return <AdminDashboard />
}

export default Index

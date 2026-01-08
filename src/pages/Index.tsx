import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'

const Index = () => {
  const { role, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && role) {
      // Smart Redirection Controller
      switch (role) {
        case 'admin':
          navigate('/admin', { replace: true })
          break
        case 'professional':
          navigate('/profissional', { replace: true })
          break
        case 'client':
          navigate('/cliente-indisponivel', { replace: true }) // Or /dashboard if available
          break
        default:
          navigate('/login', { replace: true }) // Fallback
          break
      }
    }
  }, [role, loading, navigate])

  return (
    <div className="container mx-auto py-8 px-4 space-y-4 flex flex-col items-center justify-center min-h-[50vh]">
      <Skeleton className="h-12 w-64" />
      <p className="text-muted-foreground">Redirecionando...</p>
    </div>
  )
}

export default Index

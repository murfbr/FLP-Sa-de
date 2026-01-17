import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { Loader2 } from 'lucide-react'

const Index = () => {
  const { role, user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return

    if (!user) {
      // Not authenticated, redirect to login
      navigate('/login', { replace: true })
      return
    }

    if (!role) {
      // Authenticated but no role found (profile missing)
      // This technically shouldn't happen for valid users, but we handle it.
      console.warn('[Index] User authenticated but no role found.')
      // Optionally redirect to a generic error page or stay here to show error
      // navigate('/login', { replace: true }) // Or logout
      return
    }

    // Role-based Redirection
    switch (role) {
      case 'admin':
        console.log('[Index] Redirecting Admin to Dashboard')
        navigate('/admin', { replace: true })
        break
      case 'professional':
        console.log('[Index] Redirecting Professional to Area')
        navigate('/profissional', { replace: true })
        break
      case 'client':
        console.log('[Index] Redirecting Client')
        navigate('/cliente-indisponivel', { replace: true })
        break
      default:
        console.warn('[Index] Unknown role:', role)
        navigate('/cliente-indisponivel', { replace: true })
        break
    }
  }, [role, user, loading, navigate])

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Verificando credenciais...</p>
    </div>
  )
}

export default Index

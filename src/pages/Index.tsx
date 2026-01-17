import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { Loader2 } from 'lucide-react'

const Index = () => {
  const { role, user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Only decide redirect when strictly done loading and user/role are resolved
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true })
      } else if (role) {
        // Precise Redirection Logic
        switch (role) {
          case 'admin':
            navigate('/admin', { replace: true })
            break
          case 'professional':
            navigate('/profissional', { replace: true })
            break
          case 'client':
            navigate('/cliente-indisponivel', { replace: true })
            break
          default:
            // Safe fallback for unknown roles
            navigate('/cliente-indisponivel', { replace: true })
            break
        }
      }
    }
  }, [role, user, loading, navigate])

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Redirecionando para seu painel...</p>
    </div>
  )
}

export default Index

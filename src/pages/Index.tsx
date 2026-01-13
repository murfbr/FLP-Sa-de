import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { Loader2 } from 'lucide-react'

const Index = () => {
  const { role, user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Only decide redirect when strictly done loading
    if (!loading) {
      console.log(
        '[AuthDebug] Index: Checking redirection logic. User:',
        user?.email,
        'Role:',
        role,
      )
      if (!user) {
        console.log('[AuthDebug] Index: No user, redirecting to /login')
        navigate('/login', { replace: true })
      } else {
        // Authenticated logic
        console.log('[AuthDebug] Index: Authenticated. Role is:', role)
        switch (role) {
          case 'admin':
            console.log('[AuthDebug] Index: Redirecting to /admin')
            navigate('/admin', { replace: true })
            break
          case 'professional':
            console.log('[AuthDebug] Index: Redirecting to /profissional')
            navigate('/profissional', { replace: true })
            break
          case 'client':
            console.log(
              '[AuthDebug] Index: Redirecting to /cliente-indisponivel',
            )
            navigate('/cliente-indisponivel', { replace: true })
            break
          default:
            console.warn(
              '[AuthDebug] Index: Unknown role, redirecting to /login',
            )
            navigate('/login', { replace: true })
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

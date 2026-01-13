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
      if (!user) {
        navigate('/login', { replace: true })
      } else {
        // Authenticated logic
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
            // If user exists but role is somehow null or unknown, fallback to login or an error page
            // Ideally role shouldn't be null if user is set (handled in AuthProvider)
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

import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { LogIn, Loader2 } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, user, loading, role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const from = location.state?.from?.pathname || '/'

  // Redirect if already authenticated and role is loaded
  useEffect(() => {
    if (!loading && user) {
      if (role) {
        // Smart redirect based on role if 'from' is just generic '/' or login
        if (from === '/' || from === '/login') {
          if (role === 'admin') navigate('/admin', { replace: true })
          else if (role === 'professional')
            navigate('/profissional', { replace: true })
          else navigate('/', { replace: true }) // Let Index handle client/others
        } else {
          navigate(from, { replace: true })
        }
      } else {
        // User authenticated but role is missing (fetch failed or no profile)
        // We could sign them out or let them see an error.
        // For security/cleanliness, let's just warn and maybe signOut after a delay or let user handle it manually if we provided UI.
        // But since Login page should disappear, we must ensure we don't end up in white screen.
        // AuthProvider/ProtectedRoute usually handles this if we wrap Login, but Login is Public.
        console.warn('Login: User authenticated but role missing.')
      }
    }
  }, [user, role, loading, navigate, from])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        toast({
          title: 'Erro de Autenticação',
          description: 'Email ou senha inválidos. Por favor, tente novamente.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Login bem-sucedido!',
          description: 'Aguarde o redirecionamento...',
          className: 'bg-primary text-primary-foreground',
        })
        // The useEffect will handle the redirection once 'user' and 'role' state updates
      }
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro ao tentar fazer login.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // If initial auth check is running, show simple loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user is logged in AND role is determined, we render null to avoid flicker before redirect
  // If role is missing but user is logged in, we stay here so user can see they are logged in or sign out.
  // Ideally, we should show a specific error state here too, but for now we fallback to the login form
  // allowing them to sign out via the logic below (which is not present in standard login form).
  // Actually, standard behavior: if user logged in, we expect redirect. If !role, we probably want to force logout.
  if (user && role) return null

  // Edge case: User logged in but no role found (and loading finished)
  if (user && !role) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-112px)] py-12">
        <Card className="w-full max-w-sm border-destructive/50">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Erro de Perfil</CardTitle>
            <CardDescription>
              Não foi possível carregar seu perfil de usuário.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await signOut()
                // window.location.reload() // Optional
              }}
            >
              Sair e Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-112px)] py-12">
      <Card className="w-full max-w-sm animate-fade-in-up shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Acesse sua Conta</CardTitle>
          <CardDescription>
            Use seu email e senha para entrar no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Não tem uma conta?{' '}
              <Link
                to="/register"
                className="underline hover:text-primary transition-colors"
              >
                Cadastre-se
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login

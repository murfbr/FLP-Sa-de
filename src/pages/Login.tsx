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
        // Smart redirect based on role
        if (from === '/' || from === '/login') {
          if (role === 'admin') navigate('/admin', { replace: true })
          else if (role === 'professional')
            navigate('/profissional', { replace: true })
          else navigate('/', { replace: true })
        } else {
          navigate(from, { replace: true })
        }
      }
      // If user is authenticated but role is missing, we wait or show error below.
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
        // Successful login
        // The useEffect will handle the redirection once 'user' and 'role' state updates
        // We don't show success toast to avoid clutter before redirect, or we can:
        // toast({ title: "Bem-vindo!" })
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

  // If initial auth check is running or we are processing login
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user is logged in AND role is determined, render null while redirect happens
  if (user && role) return null

  // Edge case: User logged in but no role found (and loading finished)
  if (user && !role) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-112px)] py-12">
        <Card className="w-full max-w-sm border-destructive/50">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">
              Perfil não Encontrado
            </CardTitle>
            <CardDescription>
              Não foi possível carregar seu perfil de usuário. Isso pode indicar
              que seu cadastro ainda não foi inicializado corretamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await signOut()
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

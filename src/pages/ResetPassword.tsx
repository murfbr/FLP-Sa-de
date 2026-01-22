import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, LockKeyhole } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  // Verify if we have a session (from the reset link)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({
          title: 'Link Inválido ou Expirado',
          description:
            'Por favor, solicite um novo link de redefinição de senha.',
          variant: 'destructive',
        })
        navigate('/forgot-password')
      }
    })
  }, [navigate, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
    } else {
      toast({
        title: 'Senha Atualizada',
        description:
          'Sua senha foi alterada com sucesso. Você já pode fazer login.',
      })
      navigate('/login')
    }
    setIsLoading(false)
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-sm animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary rounded-full h-12 w-12 flex items-center justify-center mb-4">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Redefinir Senha</CardTitle>
          <CardDescription>Crie uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

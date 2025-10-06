import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowRight, User, Briefcase } from 'lucide-react'

const Index = () => {
  return (
    <div className="container mx-auto py-12 px-4">
      <section className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-bold font-sans tracking-tight mb-4">
          Bem-vindo à FPL Saúde
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          Sua jornada para o bem-estar começa aqui.
        </p>
        <p className="font-serif italic text-2xl text-secondary font-medium">
          Cuidando de você em cada movimento.
        </p>
      </section>

      <section
        className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-fade-in-up"
        style={{ animationDelay: '0.3s' }}
      >
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <User className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl font-sans font-semibold">
                Área do Cliente
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-6">
              Acesse seus agendamentos, pacotes e acompanhe sua evolução de
              forma simples e rápida.
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/cliente">
                Acessar Portal do Cliente{' '}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Briefcase className="w-8 h-8 text-secondary" />
              <CardTitle className="text-2xl font-sans font-semibold">
                Área do Profissional
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-6">
              Gerencie sua agenda, pacientes e faturamento com ferramentas
              exclusivas para profissionais.
            </CardDescription>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/profissional">
                Acessar Portal do Profissional{' '}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default Index

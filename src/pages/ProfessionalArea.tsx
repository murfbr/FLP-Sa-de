import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

const ProfessionalArea = () => {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen py-8 px-4 text-center">
      <h1 className="text-4xl font-bold font-sans mb-4">
        Área do Profissional
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Esta página está em construção. Volte em breve para mais novidades!
      </p>
      <Button asChild>
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a Página Inicial
        </Link>
      </Button>
    </div>
  )
}

export default ProfessionalArea

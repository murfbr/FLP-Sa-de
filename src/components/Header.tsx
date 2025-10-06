import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold text-lg text-primary">FPL Saúde</span>
        </Link>
        <nav className="flex items-center space-x-2">
          <Button variant="ghost" asChild>
            <Link to="/cliente">Área do Cliente</Link>
          </Button>
          <Button asChild>
            <Link to="/profissional">Área do Profissional</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

import { Link } from 'react-router-dom'
import { useIsMobile } from '@/hooks/use-mobile'
import { UserNav } from './header/UserNav'
import { MobileNav } from './header/MobileNav'

export const Header = () => {
  const isMobile = useIsMobile()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold text-lg text-primary">FPL Saúde</span>
        </Link>
        <nav>{isMobile ? <MobileNav /> : <UserNav />}</nav>
      </div>
    </header>
  )
}

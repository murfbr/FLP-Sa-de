import { Link } from 'react-router-dom'
import { useIsMobile } from '@/hooks/use-mobile'
import { UserNav } from './header/UserNav'
import { MobileNav } from './header/MobileNav'
import { useAuth } from '@/providers/AuthProvider'
import { Skeleton } from './ui/skeleton'

export const Header = () => {
  const isMobile = useIsMobile()
  const { loading } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold text-lg text-primary">FPL Saúde</span>
        </Link>
        <nav>
          {loading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ) : isMobile ? (
            <MobileNav />
          ) : (
            <UserNav />
          )}
        </nav>
      </div>
    </header>
  )
}

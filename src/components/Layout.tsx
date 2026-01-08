import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/providers/AuthProvider'

export default function Layout() {
  const { user, loading } = useAuth()

  // Resilient Layout Architecture:
  // Ensure we don't render the layout shell if there is no user data and we are not loading.
  // This prevents child components from accessing a null user context.
  // Although ProtectedRoute wraps this, this is a secondary safety check.
  if (!loading && !user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

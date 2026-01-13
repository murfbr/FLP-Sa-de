import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/providers/AuthProvider'

export default function Layout() {
  const { user, loading } = useAuth()

  // Safety check: Layout should theoretically be protected by ProtectedRoute
  // but if it renders while loading or without user, we want to handle it gracefully.

  if (loading) {
    return null // ProtectedRoute handles the loading spinner
  }

  if (!user) {
    return null // ProtectedRoute handles redirect
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

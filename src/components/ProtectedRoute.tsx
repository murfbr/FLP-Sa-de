import { ReactNode, useEffect, useState, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { UserRole } from '@/types'
import { Loader2, LogOut, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

const REDIRECT_GRACE_PERIOD_MS = 1500 // Time to wait before redirecting if user appears missing (grace period for refresh)

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: ProtectedRouteProps) => {
  const { user, role, loading, signOut } = useAuth()
  const location = useLocation()

  // States for graceful handling
  const [showLongLoadingMessage, setShowLongLoadingMessage] = useState(false)
  const [isVerifyingSession, setIsVerifyingSession] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  const graceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Long loading timer (visual feedback)
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (loading) {
      timer = setTimeout(() => {
        setShowLongLoadingMessage(true)
      }, 2000)
    } else {
      setShowLongLoadingMessage(false)
    }
    return () => clearTimeout(timer)
  }, [loading])

  // Graceful Redirect Logic
  // If loading is false, but user is null, wait a bit before hard redirecting
  // This handles split-second states where token might be refreshing or network glitches
  useEffect(() => {
    if (!loading && !user) {
      // Start grace period
      setIsVerifyingSession(true)
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current)

      graceTimerRef.current = setTimeout(() => {
        console.log('[AuthDebug] Grace period expired. Redirecting to login.')
        setShouldRedirect(true)
        setIsVerifyingSession(false)
      }, REDIRECT_GRACE_PERIOD_MS)
    } else if (user) {
      // User is present, cancel any pending redirect
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current)
      setIsVerifyingSession(false)
      setShouldRedirect(false)
    }

    return () => {
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current)
    }
  }, [loading, user])

  // Debug Logging
  useEffect(() => {
    if (loading) {
      // Waiting
    } else if (!user && !isVerifyingSession && shouldRedirect) {
      console.log(
        '[AuthDebug] Redirecting: No user found for',
        location.pathname,
      )
    } else if (user && allowedRoles && role && !allowedRoles.includes(role)) {
      console.log(
        `[AuthDebug] Access denied: Role ${role} not in [${allowedRoles.join(', ')}]`,
      )
    }
  }, [
    loading,
    user,
    role,
    location,
    allowedRoles,
    isVerifyingSession,
    shouldRedirect,
  ])

  // 1. Loading State or Verifying Session (Grace Period)
  if (loading || isVerifyingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-6 p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse text-sm text-center">
            {isVerifyingSession ? (
              'Verificando sessão...'
            ) : showLongLoadingMessage ? (
              <span className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />A conexão está lenta,
                aguarde...
              </span>
            ) : (
              'Carregando informações...'
            )}
          </p>
        </div>

        {/* Global Emergency Logout */}
        <div className="mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  // 2. Authentication Check (after grace period)
  if (!user || shouldRedirect) {
    // Redirect to login, preserving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Role Authorization Check
  if (allowedRoles && role) {
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/access-denied" replace />
    }
  }

  // 4. Render Authorized Content
  return <>{children}</>
}

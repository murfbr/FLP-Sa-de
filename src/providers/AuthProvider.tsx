import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole | null
  professionalId: string | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [professionalId, setProfessionalId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfileAndRole = useCallback(
    async (currentUser: User | null): Promise<void> => {
      console.log(
        '[AuthDebug] fetchProfileAndRole: Fetching profile for user:',
        currentUser?.id,
      )
      if (!currentUser) {
        setRole(null)
        setProfessionalId(null)
        return
      }

      try {
        // Fetch Profile for Role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (profileError) {
          console.error(
            '[AuthDebug] fetchProfileAndRole: Error fetching profile:',
            profileError,
          )
        }

        // Default to 'client' if no profile found (safe fallback)
        const userRole = (profileData?.role as UserRole) ?? 'client'
        console.log(
          '[AuthDebug] fetchProfileAndRole: Role determined:',
          userRole,
        )
        setRole(userRole)

        // Fetch Professional ID if applicable
        if (userRole === 'professional' || userRole === 'admin') {
          const { data: professionalData, error: profError } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle()

          if (profError) {
            console.error(
              '[AuthDebug] fetchProfileAndRole: Error fetching professional:',
              profError,
            )
          }
          setProfessionalId(professionalData?.id ?? null)
          console.log(
            '[AuthDebug] fetchProfileAndRole: Professional ID:',
            professionalData?.id,
          )
        } else {
          setProfessionalId(null)
        }
      } catch (error) {
        console.error(
          '[AuthDebug] fetchProfileAndRole: Unexpected error fetching profile:',
          error,
        )
        // Fallback to client to allow app to load at least
        setRole('client')
        setProfessionalId(null)
      }
    },
    [],
  )

  useEffect(() => {
    let mounted = true
    console.log('[AuthDebug] AuthProvider: Initializing...')

    const initializeAuth = async () => {
      try {
        // 1. Get initial session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (mounted) {
          if (initialSession) {
            console.log(
              '[AuthDebug] AuthProvider: Initial session found for:',
              initialSession.user.email,
            )
            setSession(initialSession)
            setUser(initialSession.user)
            // 2. Fetch profile BEFORE setting loading to false
            await fetchProfileAndRole(initialSession.user)
          } else {
            console.log('[AuthDebug] AuthProvider: No initial session found.')
            setSession(null)
            setUser(null)
            setRole(null)
            setProfessionalId(null)
          }
        }
      } catch (error) {
        console.error('[AuthDebug] AuthProvider: Initialization error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          console.log(
            '[AuthDebug] AuthProvider: Initialization complete. Loading set to false.',
          )
        }
      }
    }

    initializeAuth()

    // 3. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession) => {
        if (!mounted) return
        console.log(`[AuthDebug] AuthProvider: Auth event '${event}'`)

        if (event === 'SIGNED_OUT') {
          console.log('[AuthDebug] Handling SIGNED_OUT...')
          setSession(null)
          setUser(null)
          setRole(null)
          setProfessionalId(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          console.log(
            '[AuthDebug] Handling SIGNED_IN/USER_UPDATED. User:',
            currentSession?.user.email,
          )
          setSession(currentSession)
          setUser(currentSession?.user ?? null)

          // Force a loading state while we fetch the profile to prevent redirection loops
          setLoading(true)
          await fetchProfileAndRole(currentSession?.user ?? null)
          if (mounted) setLoading(false)
        } else if (event === 'TOKEN_REFRESHED') {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          // Typically profile doesn't change on token refresh, but we can re-verify if needed
          // For now, let's just ensure user state is fresh without blocking
        }
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfileAndRole])

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    console.log('[AuthDebug] signIn: Attempting login for', email)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.error('[AuthDebug] signIn: Error:', error.message)
    } else {
      console.log('[AuthDebug] signIn: Success')
    }
    return { error }
  }

  const signOut = async () => {
    console.log('[AuthDebug] signOut: Signing out...')
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setSession(null)
      setUser(null)
      setRole(null)
      setProfessionalId(null)
      console.log('[AuthDebug] signOut: User signed out successfully.')
    } else {
      console.error('[AuthDebug] signOut: Error signing out:', error.message)
    }
    return { error }
  }

  const value = {
    user,
    session,
    role,
    professionalId,
    signUp,
    signIn,
    signOut,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

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
          console.error('AuthProvider: Error fetching profile:', profileError)
        }

        // Default to 'client' if no profile found (safe fallback)
        const userRole = (profileData?.role as UserRole) ?? 'client'
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
              'AuthProvider: Error fetching professional:',
              profError,
            )
          }
          setProfessionalId(professionalData?.id ?? null)
        } else {
          setProfessionalId(null)
        }
      } catch (error) {
        console.error('AuthProvider: Unexpected error fetching profile:', error)
        // Fallback to client to allow app to load at least
        setRole('client')
        setProfessionalId(null)
      }
    },
    [],
  )

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      console.log('AuthProvider: Initializing...')
      try {
        // 1. Get initial session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (mounted) {
          if (initialSession) {
            console.log('AuthProvider: Session found.')
            setSession(initialSession)
            setUser(initialSession.user)
            // 2. Fetch profile BEFORE setting loading to false
            await fetchProfileAndRole(initialSession.user)
          } else {
            console.log('AuthProvider: No session found.')
            setSession(null)
            setUser(null)
            setRole(null)
            setProfessionalId(null)
          }
        }
      } catch (error) {
        console.error('AuthProvider: Initialization error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('AuthProvider: Initialization complete.')
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
        console.log(`AuthProvider: Auth event '${event}'`)

        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setRole(null)
          setProfessionalId(null)
          setLoading(false)
        } else if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'INITIAL_SESSION' ||
          event === 'USER_UPDATED'
        ) {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          // We must reload profile on sign in or user update
          // Set loading true briefly if it's a critical change
          if (event === 'SIGNED_IN') {
            setLoading(true)
            await fetchProfileAndRole(currentSession?.user ?? null)
            if (mounted) setLoading(false)
          } else {
            // Background update for token refresh, don't block UI with loading
            fetchProfileAndRole(currentSession?.user ?? null)
          }
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setSession(null)
      setUser(null)
      setRole(null)
      setProfessionalId(null)
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

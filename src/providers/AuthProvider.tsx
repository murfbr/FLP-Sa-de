import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
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

  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const fetchProfileAndRole = useCallback(
    async (currentUser: User | null, forceRefresh = false) => {
      if (!currentUser) {
        if (isMounted.current) {
          setRole(null)
          setProfessionalId(null)
          setLoading(false)
        }
        return
      }

      // If we already have a role and not forcing refresh, skip to avoid redundant fetches
      if (role && !forceRefresh) {
        if (isMounted.current) setLoading(false)
        return
      }

      try {
        // Optimized: Fetch role directly.
        // Using maybeSingle() avoids errors if no row exists (returns null).
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (profileError) {
          console.error('[Auth] Error fetching profile:', profileError)
          // If there's an error (e.g. network), we DO NOT default to client.
          // We stop loading but leave role as null/current.
          // ProtectedRoute will handle the missing role gracefully (e.g. show error/retry).
          if (isMounted.current) setLoading(false)
          return
        }

        // Default to 'client' ONLY if no profile row is found (e.g. new user before trigger runs)
        // This ensures admins with missing profiles don't get "client" access if the DB is consistent.
        // Assuming valid admins ALWAYS have a profile row.
        const userRole = (profileData?.role as UserRole) || 'client'

        let profId = null
        if (userRole === 'professional' || userRole === 'admin') {
          const { data: profData } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle()

          if (profData) {
            profId = profData.id
          }
        }

        if (isMounted.current) {
          setRole(userRole)
          setProfessionalId(profId)
        }
      } catch (error) {
        console.error('[Auth] Unexpected error fetching profile:', error)
      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    },
    [role],
  )

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Get initial session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (isMounted.current) {
          if (initialSession) {
            setSession(initialSession)
            setUser(initialSession.user)
            // Fetch profile immediately
            await fetchProfileAndRole(initialSession.user, true)
          } else {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error)
        if (isMounted.current) setLoading(false)
      }
    }

    initializeAuth()

    // 2. Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted.current) return

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setRole(null)
        setProfessionalId(null)
        setLoading(false)
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        // Force fetch on login or if user update might change role
        // For token refresh, only fetch if we somehow lost the role
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || !role) {
          setLoading(true)
          await fetchProfileAndRole(currentSession?.user ?? null, true)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array to run once on mount

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
    if (isMounted.current) {
      setSession(null)
      setUser(null)
      setRole(null)
      setProfessionalId(null)
      setLoading(false)
    }
    const { error } = await supabase.auth.signOut()
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

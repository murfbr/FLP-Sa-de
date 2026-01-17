import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

// Derive UserRole from Supabase types to ensure consistency with DB
export type UserRole = Database['public']['Enums']['user_role']

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

  const fetchProfileAndRole = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      if (isMounted.current) {
        setRole(null)
        setProfessionalId(null)
        setLoading(false)
      }
      return
    }

    try {
      console.log('[Auth] Fetching profile for user:', currentUser.id)

      // 1. Fetch Profile Role from public.profiles
      // Using maybeSingle() handles 0 or 1 row. RLS should allow reading own row.
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (profileError) {
        console.error('[Auth] Error fetching profile:', profileError)
        // If error is technical (network/RLS), log it.
        // We continue to set loading false at the end so UI can show error state if role is missing.
      }

      if (!profileData) {
        console.warn('[Auth] No profile found for user (RLS or missing row).')
        if (isMounted.current) {
          setRole(null)
          setProfessionalId(null)
        }
      } else {
        const userRole = profileData.role
        console.log('[Auth] Profile found. Role:', userRole)

        // 2. Fetch Professional ID if needed (for professionals and admins)
        let profId = null
        if (userRole === 'professional' || userRole === 'admin') {
          const { data: profData, error: profError } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle()

          if (profError) {
            console.error(
              '[Auth] Error fetching professional record:',
              profError,
            )
          }

          if (profData) {
            profId = profData.id
            console.log('[Auth] Professional ID found:', profId)
          } else {
            console.log('[Auth] No professional record linked to this user.')
          }
        }

        if (isMounted.current) {
          setRole(userRole)
          setProfessionalId(profId)
        }
      }
    } catch (error) {
      console.error('[Auth] Unexpected error fetching profile:', error)
      if (isMounted.current) {
        setRole(null)
        setProfessionalId(null)
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [])

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
            // Fetch profile immediately for initial session
            await fetchProfileAndRole(initialSession.user)
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

      console.log('[Auth] Auth state change:', event)

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setRole(null)
        setProfessionalId(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // When signing in, we set loading to true to prevent premature redirects
        // until profile is fetched
        setLoading(true)
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await fetchProfileAndRole(currentSession.user)
        } else {
          setLoading(false)
        }
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
      }
    })

    return () => {
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
    // We do NOT set loading to true here to allow instant UI feedback for logout actions
    // driven by ProtectedRoute recovery options
    console.log('[Auth] Signing out...')
    const { error } = await supabase.auth.signOut()
    // State cleanup is handled by onAuthStateChange('SIGNED_OUT')
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

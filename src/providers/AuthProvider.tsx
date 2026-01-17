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
    // If no user, we can't fetch profile. Reset role/profId and stop loading.
    if (!currentUser) {
      if (isMounted.current) {
        setRole(null)
        setProfessionalId(null)
        setLoading(false)
      }
      return
    }

    try {
      // Define the fetch operation
      const fetchOperation = async () => {
        // 1. Fetch Profile Role from public.profiles
        // We use maybeSingle() because RLS might return no rows if policy isn't met, or row might not exist.
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (profileError) {
          // If it's a real database error (not just not found), throw it.
          // Note: RLS blocking access usually results in data: null, error: null (empty set).
          console.error('[Auth] Error fetching profile:', profileError)
          throw profileError
        }

        if (!profileData) {
          // Profile document missing or RLS blocked access.
          return { role: null, profId: null }
        }

        const userRole = profileData.role

        // 2. Fetch Professional ID if needed (for professionals and admins)
        let profId = null
        if (userRole === 'professional' || userRole === 'admin') {
          const { data: profData, error: profError } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle()

          if (!profError && profData) {
            profId = profData.id
          }
        }

        return { role: userRole, profId }
      }

      // Execute fetch
      const result = await fetchOperation()

      if (isMounted.current) {
        setRole(result.role)
        setProfessionalId(result.profId)
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

        // Only fetch profile if we have a user and (it's a fresh login OR we are missing role)
        // We avoid re-fetching on TOKEN_REFRESHED if role is already present to prevent UI flicker
        if (
          currentSession?.user &&
          (event === 'SIGNED_IN' || !role || event === 'USER_UPDATED')
        ) {
          // Ensure we show loading while fetching profile during a Sign In event
          if (event === 'SIGNED_IN') setLoading(true)
          await fetchProfileAndRole(currentSession.user)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfileAndRole, role])

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
      setLoading(true)
    }
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

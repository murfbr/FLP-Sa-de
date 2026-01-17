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

      // Define the fetch operation
      const fetchOperation = async () => {
        // 1. Fetch Profile Role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (!profileData) {
          console.warn('[Auth] No profile found for user:', currentUser.id)
          return { role: null, profId: null }
        }

        const userRole = profileData.role
        console.log('[Auth] Role determined:', userRole)

        // 2. Fetch Professional ID if needed
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

      // Create a timeout promise (10 seconds)
      const timeoutPromise = new Promise<{
        role: UserRole | null
        profId: string | null
      }>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timed out')), 10000),
      )

      // Race the fetch against the timeout
      const result = await Promise.race([fetchOperation(), timeoutPromise])

      if (isMounted.current) {
        setRole(result.role)
        setProfessionalId(result.profId)
        // Loading will be set to false in finally block
      }
    } catch (error) {
      console.error('[Auth] Unexpected error fetching profile:', error)
      // We do NOT set role to null here implicitly to avoid flashing,
      // but if initial load fails, we might end up with !role and !loading
      // which ProtectedRoute handles as "Profile not found".
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
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        // Only fetch profile if it's a SIGNED_IN event (fresh login) or we don't have a role yet
        // We avoid re-fetching on TOKEN_REFRESHED if role is already present to prevent UI flicker
        if (event === 'SIGNED_IN' || !role) {
          setLoading(true)
          await fetchProfileAndRole(currentSession?.user ?? null)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfileAndRole]) // We keep minimal dependencies to avoid loops

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
    if (isMounted.current) {
      setSession(null)
      setUser(null)
      setRole(null)
      setProfessionalId(null)
      setLoading(false)
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

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

const PROFILE_FETCH_TIMEOUT_MS = 15000 // 15 seconds max for profile fetch

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
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Profile fetch timeout')),
          PROFILE_FETCH_TIMEOUT_MS,
        ),
      )

      // Actual fetch logic
      const fetchLogic = async () => {
        console.log('[Auth] Fetching profile for user:', currentUser.id)

        // 1. Fetch Profile Role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (!profileData) {
          console.warn('[Auth] No profile found for user.')
          if (isMounted.current) {
            setRole(null)
            setProfessionalId(null)
          }
          return
        }

        const userRole = profileData.role
        console.log('[Auth] Profile found. Role:', userRole)

        // 2. Fetch Professional ID if applicable
        let profId = null
        if (userRole === 'professional' || userRole === 'admin') {
          const { data: profData, error: profError } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle()

          if (profError)
            console.error(
              '[Auth] Error fetching professional record:',
              profError,
            )

          if (profData) {
            profId = profData.id
            console.log('[Auth] Professional ID found:', profId)
          }
        }

        if (isMounted.current) {
          setRole(userRole)
          setProfessionalId(profId)
        }
      }

      // Race against timeout
      await Promise.race([fetchLogic(), timeoutPromise])
    } catch (error) {
      console.error('[Auth] Error fetching profile:', error)
      if (isMounted.current) {
        // Don't clear role if it was a timeout but we might have partial data?
        // Better to fail safe.
        // If we fail to fetch profile, we can't determine role, so user effectively has no role.
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
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
          await fetchProfileAndRole(initialSession.user)
        } else {
          setSession(null)
          setUser(null)
          setRole(null)
          setProfessionalId(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error)
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return
      console.log('[Auth] Auth state change:', event)

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setRole(null)
        setProfessionalId(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Only trigger fetch if we have a user and we are not already loading or if session changed
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setLoading(true) // Ensure loading is true while we fetch profile
        if (currentSession?.user) {
          await fetchProfileAndRole(currentSession.user)
        } else {
          setLoading(false)
        }
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        // Usually mostly redundant to re-fetch profile on token refresh unless claims change
        // But safe to leave loading state as is (false)
      }
    })

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
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) setLoading(false)
    return { error }
  }

  const signOut = async () => {
    console.log('[Auth] Signing out...')

    // Explicitly clear local state immediately
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

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
  error: Error | null
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const MAX_RETRIES = 2
const RETRY_DELAY = 500 // ms

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [professionalId, setProfessionalId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

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
        setError(null)
      }
      return
    }

    let attempts = 0
    let success = false
    let lastError: any = null

    while (attempts <= MAX_RETRIES && !success) {
      try {
        console.log(
          `[Auth] Fetching profile for user: ${currentUser.id} (Attempt ${attempts + 1})`,
        )

        // 1. Fetch Profile Role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (!profileData) {
          console.warn('[Auth] No profile found for user.')
          // This is critical - user exists in Auth but not in DB (profiles).
          // We treat this as an error state so the UI can handle it (Sign out option)
          throw new Error('Perfil de usuário não encontrado no sistema.')
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

          // For professionals, this is critical. For admins, maybe optional but good to have.
          if (profError) {
            console.error(
              '[Auth] Error fetching professional record:',
              profError,
            )
            // We don't block login if professional record is missing for admin,
            // but for 'professional' role it might be important.
            // For now, we log and proceed, unless it's a network error which the catch block handles.
          }

          if (profData) {
            profId = profData.id
            console.log('[Auth] Professional ID found:', profId)
          }
        }

        if (isMounted.current) {
          setRole(userRole)
          setProfessionalId(profId)
          setError(null)
          // We set loading to false only at the very end of the successful flow
          setLoading(false)
        }
        success = true
      } catch (err: any) {
        console.error(`[Auth] Attempt ${attempts + 1} failed:`, err)
        lastError = err
        attempts++
        if (attempts <= MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        }
      }
    }

    if (!success && isMounted.current) {
      console.error('[Auth] All attempts to fetch profile failed.')
      setError(lastError || new Error('Falha ao carregar perfil.'))
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('[Auth] Auth state change:', event)

      if (event === 'SIGNED_OUT') {
        if (isMounted.current) {
          setSession(null)
          setUser(null)
          setRole(null)
          setProfessionalId(null)
          setError(null)
          setLoading(false)
        }
        localStorage.removeItem('sb-fpl-saude-auth-token')
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'INITIAL_SESSION'
      ) {
        // Only trigger update if something changed or we are missing data
        if (isMounted.current) {
          const newUser = currentSession?.user ?? null
          setSession(currentSession)
          setUser(newUser)

          // If we have a user but no role (or user changed), fetch profile
          // We check 'loading' to avoid double-fetching if initializeAuth is already running
          // But 'TOKEN_REFRESHED' might happen while active, so we double check.
          if (newUser) {
            // If we already have the role for this user, don't re-fetch on simple token refresh
            // unless we want to keep role in sync.
            // We use a simple check: if role is missing, or if user ID changed.
            if (!role || user?.id !== newUser.id) {
              // Ensure loading is true while we fetch
              setLoading(true)
              fetchProfileAndRole(newUser)
            } else {
              // We have user and role, ensure loading is false
              setLoading(false)
            }
          } else {
            // No user in session
            setLoading(false)
          }
        }
      } else if (event === 'USER_UPDATED') {
        if (isMounted.current && currentSession?.user) {
          setSession(currentSession)
          setUser(currentSession.user)
          fetchProfileAndRole(currentSession.user)
        }
      }
    })

    // Check for existing session immediately on mount
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted.current) {
        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
          // Fetch profile immediately
          fetchProfileAndRole(initialSession.user)
        } else {
          // No session, stop loading
          setLoading(false)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfileAndRole, role, user?.id])

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
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setLoading(false)
      setError(error)
    }
    // If success, onAuthStateChange will handle the rest
    return { error }
  }

  const signOut = async () => {
    console.log('[Auth] Signing out...')
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (e: any) {
      console.error('[Auth] Error signing out:', e)
      setError(e)
    } finally {
      if (isMounted.current) {
        setSession(null)
        setUser(null)
        setRole(null)
        setProfessionalId(null)
        setError(null)
        setLoading(false)
      }
    }
    return { error: null }
  }

  const refreshProfile = async () => {
    if (user) {
      setLoading(true)
      await fetchProfileAndRole(user)
    }
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
    error,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

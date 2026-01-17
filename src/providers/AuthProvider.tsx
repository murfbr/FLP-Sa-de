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

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

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

    let attempts = 0
    let success = false

    while (attempts < MAX_RETRIES && !success) {
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
          // If profile is missing but no error, it might be a sync issue or incomplete signup.
          // We don't retry in this specific case as it's not a network error.
          if (isMounted.current) {
            setRole(null)
            setProfessionalId(null)
          }
          break // Exit loop
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

          // If professional fetch fails, we log it but don't block auth entirely if possible,
          // though for professionals it's critical.
          if (profError) {
            console.error(
              '[Auth] Error fetching professional record:',
              profError,
            )
            // We might want to retry if this fails too
            throw profError
          }

          if (profData) {
            profId = profData.id
            console.log('[Auth] Professional ID found:', profId)
          }
        }

        if (isMounted.current) {
          setRole(userRole)
          setProfessionalId(profId)
          setLoading(false)
        }
        success = true
      } catch (error: any) {
        console.error('[Auth] Error fetching profile:', error)
        attempts++
        if (attempts < MAX_RETRIES) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        } else {
          // Final failure
          if (isMounted.current) {
            // Keep user logged in but with limited access (role null)
            // Or strictly fail. Here we set loaded to false so UI can show error or retry
            setLoading(false)
          }
        }
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
          // Don't set loading false yet, fetch profile first
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
        // Clear everything
        setSession(null)
        setUser(null)
        setRole(null)
        setProfessionalId(null)
        setLoading(false)
        // Clear local storage just in case
        localStorage.removeItem('sb-fpl-saude-auth-token')
      } else if (
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED' ||
        event === 'TOKEN_REFRESHED'
      ) {
        // Handle session update
        const prevUser = user?.id
        const nextUser = currentSession?.user?.id

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        // Only fetch profile if user CHANGED or if we don't have a role yet (and have a user)
        // TOKEN_REFRESHED usually doesn't change role, but safe to check if we are missing role.
        if (nextUser && (prevUser !== nextUser || !role)) {
          setLoading(true)
          await fetchProfileAndRole(currentSession!.user)
        } else if (event === 'TOKEN_REFRESHED') {
          // Just refreshing token, no need to reload full profile if we have it
          // But ensure loading is false
          if (loading) setLoading(false)
        } else if (!nextUser) {
          // Should be covered by SIGNED_OUT but just in case
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfileAndRole, role, user?.id, loading])

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
    if (error) {
      setLoading(false)
    }
    // If success, onAuthStateChange will handle the rest
    return { error }
  }

  const signOut = async () => {
    console.log('[Auth] Signing out...')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (e) {
      console.error('[Auth] Error signing out:', e)
      // Force local cleanup anyway
      if (isMounted.current) {
        setSession(null)
        setUser(null)
        setRole(null)
        setProfessionalId(null)
        setLoading(false)
      }
    }
    return { error: null }
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

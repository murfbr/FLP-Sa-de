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

  const fetchUserRoleAndProfile = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        setRole(null)
        setProfessionalId(null)
        setLoading(false)
        return
      }

      try {
        // Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
        }

        // Default to 'client' for safety if no role is found or if RLS hides it
        // This handles the case where profile might not exist yet for new users
        const userRole = (profileData?.role as UserRole) ?? 'client'
        setRole(userRole)

        // Check for professional ID if role is professional OR admin
        if (userRole === 'professional' || userRole === 'admin') {
          const { data: professionalData, error: profError } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle()

          if (profError) {
            console.error('Error fetching professional:', profError)
          }

          setProfessionalId(professionalData?.id ?? null)
        } else {
          setProfessionalId(null)
        }
      } catch (error) {
        console.error('Unexpected error in auth fetch:', error)
        setRole('client') // Fallback
        setProfessionalId(null)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    let mounted = true

    // Initial Session Check
    const checkSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (mounted) {
          if (initialSession) {
            setSession(initialSession)
            setUser(initialSession.user)
            // Fetch profile only if session exists
            await fetchUserRoleAndProfile(initialSession.user)
          } else {
            // No session found
            setSession(null)
            setUser(null)
            setRole(null)
            setProfessionalId(null)
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
        if (mounted) setLoading(false)
      }
    }

    checkSession()

    // Auth State Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession) => {
        if (!mounted) return

        setSession(currentSession)
        const currentUser = currentSession?.user ?? null
        setUser(currentUser)

        if (
          event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          event === 'USER_UPDATED' ||
          event === 'TOKEN_REFRESHED'
        ) {
          if (currentUser) {
            // Only set loading to true if we are actually going to fetch something new
            // For token refresh, usually profile doesn't change, but safe to verify
            if (event !== 'TOKEN_REFRESHED') setLoading(true)
            await fetchUserRoleAndProfile(currentUser)
          } else {
            setLoading(false)
          }
        } else if (event === 'SIGNED_OUT') {
          setLoading(false)
          setRole(null)
          setProfessionalId(null)
          // Clear query cache or local state if needed here
        }
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserRoleAndProfile])

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
    setRole(null)
    setProfessionalId(null)
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

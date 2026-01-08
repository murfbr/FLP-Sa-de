import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
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

  useEffect(() => {
    let mounted = true

    const fetchUserRoleAndProfile = async (currentUser: User | null) => {
      try {
        if (currentUser) {
          // Fetch Profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .maybeSingle()

          if (profileError) {
            console.error('Error fetching profile:', profileError)
          }

          // Default to 'client' for safety if no role is found
          const userRole = (profileData?.role as UserRole) ?? 'client'

          if (mounted) setRole(userRole)

          // Check for professional ID if role is professional OR admin (Dual Role Recognition)
          if (userRole === 'professional' || userRole === 'admin') {
            const { data: professionalData, error: profError } = await supabase
              .from('professionals')
              .select('id')
              .eq('user_id', currentUser.id)
              .maybeSingle()

            if (profError) {
              console.error('Error fetching professional:', profError)
            }

            if (mounted) setProfessionalId(professionalData?.id ?? null)
          } else {
            if (mounted) setProfessionalId(null)
          }
        } else {
          if (mounted) {
            setRole(null)
            setProfessionalId(null)
          }
        }
      } catch (error) {
        console.error('Unexpected error in auth fetch:', error)
        // Ensure we don't leave the app in a broken state
        if (mounted) {
          setRole(null)
          setProfessionalId(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session)
        const currentUser = session?.user ?? null
        setUser(currentUser)
        // Only fetch role if we have a user, otherwise stop loading
        if (currentUser) {
          fetchUserRoleAndProfile(currentUser)
        } else {
          setLoading(false)
        }
      }
    })

    // Auth State Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      if (mounted) {
        setSession(session)
        const currentUser = session?.user ?? null
        setUser(currentUser)

        // Optimize loading state transitions
        if (
          event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          event === 'USER_UPDATED'
        ) {
          setLoading(true)
          fetchUserRoleAndProfile(currentUser)
        } else if (event === 'SIGNED_OUT') {
          setLoading(false)
          setRole(null)
          setProfessionalId(null)
        } else if (event === 'TOKEN_REFRESHED') {
          // Do nothing on token refresh to avoid UI flickering
          // Assuming role doesn't change on token refresh
        } else {
          // For other events, ensure loading is disabled if we have a user or not
          // But safer to just let it be handled by specific events
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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

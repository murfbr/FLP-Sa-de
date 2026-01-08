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
        console.log('AuthProvider: No user to fetch profile for.')
        setRole(null)
        setProfessionalId(null)
        setLoading(false)
        return
      }

      console.log('AuthProvider: Fetching profile for user', currentUser.id)

      try {
        // Fetch Profile
        // We use maybeSingle to avoid 406 error if row doesn't exist yet
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (profileError) {
          console.error('AuthProvider: Error fetching profile:', profileError)
        }

        // Default to 'client' for safety if no role is found or if RLS hides it
        const userRole = (profileData?.role as UserRole) ?? 'client'
        console.log('AuthProvider: Resolved role:', userRole)
        setRole(userRole)

        // Check for professional ID if role is professional OR admin
        if (userRole === 'professional' || userRole === 'admin') {
          console.log('AuthProvider: Fetching professional ID...')
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
          console.log(
            'AuthProvider: Professional ID:',
            professionalData?.id ?? 'Not found',
          )
        } else {
          setProfessionalId(null)
        }
      } catch (error) {
        console.error('AuthProvider: Unexpected error in auth fetch:', error)
        setRole('client') // Fallback
        setProfessionalId(null)
      } finally {
        setLoading(false)
        console.log('AuthProvider: Loading complete.')
      }
    },
    [],
  )

  useEffect(() => {
    let mounted = true
    console.log('AuthProvider: Initializing...')

    // Initial Session Check
    const checkSession = async () => {
      console.log('AuthProvider: Checking initial session...')
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (mounted) {
          if (initialSession) {
            console.log('AuthProvider: Initial session found.')
            setSession(initialSession)
            setUser(initialSession.user)
            await fetchUserRoleAndProfile(initialSession.user)
          } else {
            console.log('AuthProvider: No initial session found.')
            setSession(null)
            setUser(null)
            setRole(null)
            setProfessionalId(null)
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('AuthProvider: Session check failed:', error)
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
        console.log(`AuthProvider: Auth event '${event}' detected.`)

        setSession(currentSession)
        const currentUser = currentSession?.user ?? null
        setUser(currentUser)

        if (
          event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          event === 'USER_UPDATED'
        ) {
          // Force fetch if user changed or signed in
          setLoading(true)
          await fetchUserRoleAndProfile(currentUser)
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refresh usually doesn't require profile re-fetch, but can be done if needed
          // Keeping it minimal to avoid UI flickering
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthProvider: User signed out.')
          setLoading(false)
          setRole(null)
          setProfessionalId(null)
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

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

const PROFILE_FETCH_TIMEOUT_MS = 5000

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

  // Use a ref to track mounting to avoid state updates on unmounted component
  // in complex async flows
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const fetchProfileAndRole = useCallback(
    async (currentUser: User | null): Promise<void> => {
      const startTime = performance.now()
      const logPrefix = `[AuthDebug] fetchProfileAndRole (${currentUser?.id?.slice(0, 6)}):`

      console.log(
        `${logPrefix} Starting profile fetch at ${new Date().toISOString()}`,
      )

      if (!currentUser) {
        console.log(`${logPrefix} No user provided. Clearing role.`)
        if (isMounted.current) {
          setRole(null)
          setProfessionalId(null)
        }
        return
      }

      // Default safe fallback
      let resolvedRole: UserRole = 'client'
      let resolvedProfId: string | null = null

      try {
        console.log(`${logPrefix} Initiating DB query for profile...`)
        const queryStart = performance.now()

        // TIMEOUT PROMISE
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Profile fetch timeout exceeded (${PROFILE_FETCH_TIMEOUT_MS}ms)`,
              ),
            )
          }, PROFILE_FETCH_TIMEOUT_MS)
        })

        // DATA PROMISE - Profile
        const profileQuery = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .maybeSingle()

          if (error) throw error
          return data
        }

        // RACE: Profile Query vs Timeout
        const profileData = (await Promise.race([
          profileQuery(),
          timeoutPromise,
        ])) as { role: string } | null

        const queryEnd = performance.now()
        console.log(
          `${logPrefix} Profile Query finished in ${(queryEnd - queryStart).toFixed(2)}ms`,
        )

        if (profileData) {
          resolvedRole = (profileData.role as UserRole) ?? 'client'
          console.log(`${logPrefix} Role resolved to: ${resolvedRole}`)
        } else {
          console.warn(
            `${logPrefix} No profile record found. Defaulting to 'client'.`,
          )
        }

        // Secondary fetch for professional ID if needed
        // Only run if we are still within reasonable time (simplification: just run it, but catch errors)
        if (resolvedRole === 'professional' || resolvedRole === 'admin') {
          console.log(`${logPrefix} Fetching professional ID...`)
          const { data: profData, error: profError } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle()

          if (profError) {
            console.error(
              `${logPrefix} Error fetching professional ID:`,
              profError,
            )
          } else if (profData) {
            resolvedProfId = profData.id
            console.log(`${logPrefix} Professional ID found: ${profData.id}`)
          } else {
            console.warn(
              `${logPrefix} No professional record found for role ${resolvedRole}`,
            )
          }
        }
      } catch (error: any) {
        const errorTime = performance.now()
        console.error(
          `${logPrefix} FAILED or TIMED OUT after ${(errorTime - startTime).toFixed(2)}ms. Using fallback. Error:`,
          error,
        )
        // resolvedRole remains 'client' (fallback)
      } finally {
        const endTime = performance.now()
        console.log(
          `${logPrefix} Completed total flow in ${(endTime - startTime).toFixed(2)}ms`,
        )

        if (isMounted.current) {
          setRole(resolvedRole)
          setProfessionalId(resolvedProfId)
        }
      }
    },
    [],
  )

  useEffect(() => {
    console.log('[AuthDebug] AuthProvider: Initializing...')

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (isMounted.current) {
          if (initialSession) {
            console.log('[AuthDebug] AuthProvider: Initial session found.')
            setSession(initialSession)
            setUser(initialSession.user)
            await fetchProfileAndRole(initialSession.user)
          } else {
            console.log('[AuthDebug] AuthProvider: No initial session.')
            setSession(null)
            setUser(null)
            setRole(null)
            setProfessionalId(null)
          }
        }
      } catch (error) {
        console.error(
          '[AuthDebug] AuthProvider: Critical initialization error:',
          error,
        )
      } finally {
        if (isMounted.current) {
          console.log(
            '[AuthDebug] AuthProvider: Initialization done. Setting loading=false.',
          )
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession) => {
        if (!isMounted.current) return
        console.log(`[AuthDebug] AuthProvider: Auth event '${event}'`)

        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setRole(null)
          setProfessionalId(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)

          // Only show loading if we are actually switching users or signing in
          setLoading(true)
          try {
            await fetchProfileAndRole(currentSession?.user ?? null)
          } catch (err) {
            console.error(
              '[AuthDebug] Error updating profile on auth change:',
              err,
            )
          } finally {
            if (isMounted.current) setLoading(false)
          }
        } else if (event === 'TOKEN_REFRESHED') {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
        }
      },
    )

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
    console.log('[AuthDebug] signIn: Attempting login...')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    console.log('[AuthDebug] signOut: Immediate cleanup requested.')

    // Immediate state cleanup to unblock UI
    if (isMounted.current) {
      setSession(null)
      setUser(null)
      setRole(null)
      setProfessionalId(null)
      setLoading(false)
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error)
        console.error('[AuthDebug] signOut: Supabase error:', error.message)
      return { error }
    } catch (e) {
      console.error('[AuthDebug] signOut: Exception:', e)
      return { error: e }
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

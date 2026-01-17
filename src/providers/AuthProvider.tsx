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

const PROFILE_FETCH_TIMEOUT_MS = 15000 // Increased timeout to 15s
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

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

  const logAuthEvent = (event: string, details?: any) => {
    const timestamp = new Date().toISOString()
    console.log(`[Auth] ${timestamp} | ${event}`, details || '')
  }

  const fetchProfileAndRole = useCallback(
    async (
      currentUser: User | null,
      isBackgroundRefresh = false,
    ): Promise<void> => {
      if (!currentUser) {
        logAuthEvent('ProfileFetch', 'No user provided. Clearing role.')
        if (isMounted.current) {
          setRole(null)
          setProfessionalId(null)
        }
        return
      }

      if (isBackgroundRefresh && role) {
        logAuthEvent(
          'ProfileFetch',
          'Background refresh with existing role. Skipping DB fetch.',
        )
        return
      }

      const logPrefix = `[Auth] fetchProfileAndRole (${currentUser.id.slice(0, 6)}):`
      logAuthEvent('ProfileFetch', 'Starting profile fetch...')

      let resolvedRole: UserRole | null = null
      let resolvedProfId: string | null = null
      let attempt = 0
      let success = false

      while (attempt < MAX_RETRIES && !success) {
        try {
          attempt++
          const queryStart = performance.now()

          // Timeout promise for this specific attempt
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(
                  `Profile fetch timeout exceeded (${PROFILE_FETCH_TIMEOUT_MS}ms)`,
                ),
              )
            }, PROFILE_FETCH_TIMEOUT_MS)
          })

          const profileQuery = async () => {
            const { data, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentUser.id)
              .maybeSingle()

            if (error) throw error
            return data
          }

          const profileData = (await Promise.race([
            profileQuery(),
            timeoutPromise,
          ])) as { role: string } | null

          const queryEnd = performance.now()
          logAuthEvent(
            'ProfileFetch',
            `Attempt ${attempt} finished in ${(queryEnd - queryStart).toFixed(2)}ms`,
          )

          if (profileData) {
            resolvedRole = (profileData.role as UserRole) ?? 'client'
          } else {
            console.warn(
              `${logPrefix} No profile record found. Defaulting to 'client'.`,
            )
            resolvedRole = 'client'
          }

          // Fetch Professional ID if needed
          if (resolvedRole === 'professional' || resolvedRole === 'admin') {
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
              // Don't fail the whole auth for this, but log it
            } else if (profData) {
              resolvedProfId = profData.id
            }
          }

          success = true
        } catch (error: any) {
          console.error(`${logPrefix} Attempt ${attempt} FAILED. Error:`, error)

          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * attempt
            console.log(`${logPrefix} Retrying in ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
          } else {
            console.error(`${logPrefix} Max retries reached.`)
            // We do NOT default to client here as per requirements to avoid incorrect redirect.
            // Role stays null, loading becomes false. ProtectedRoute handles the rest.
          }
        }
      }

      if (isMounted.current) {
        if (success && resolvedRole) {
          setRole(resolvedRole)
          setProfessionalId(resolvedProfId)
        }

        // Ensure loading is false after attempts are done (success or fail)
        if (!isBackgroundRefresh) {
          setLoading(false)
        }
      }
    },
    [role],
  )

  useEffect(() => {
    logAuthEvent('Initialization', 'AuthProvider initializing...')

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('[Auth] Error getting session:', error)
        }

        if (isMounted.current) {
          if (initialSession) {
            logAuthEvent(
              'Initialization',
              `Session found for ${initialSession.user.email}`,
            )
            setSession(initialSession)
            setUser(initialSession.user)
            await fetchProfileAndRole(initialSession.user, false)
          } else {
            logAuthEvent('Initialization', 'No initial session found.')
            setSession(null)
            setUser(null)
            setRole(null)
            setProfessionalId(null)
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('[Auth] Critical initialization error:', error)
        if (isMounted.current) setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession) => {
        if (!isMounted.current) return
        logAuthEvent('AuthStateChange', `Event: ${event}`)

        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setRole(null)
          setProfessionalId(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)

          if (!user || event === 'USER_UPDATED') {
            setLoading(true)
            await fetchProfileAndRole(currentSession?.user ?? null, false)
          } else {
            await fetchProfileAndRole(currentSession?.user ?? null, true)
          }
        } else if (event === 'TOKEN_REFRESHED') {
          logAuthEvent('TokenRefresh', 'Session refreshed successfully.')
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          fetchProfileAndRole(currentSession?.user ?? null, true)
        }
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    logAuthEvent('SignUp', `Attempting sign up for ${email}`)
    const redirectUrl = `${window.location.origin}/`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    logAuthEvent('SignIn', `Attempting login for ${email}`)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    logAuthEvent('SignOut', 'User initiated sign out.')

    if (isMounted.current) {
      setSession(null)
      setUser(null)
      setRole(null)
      setProfessionalId(null)
      setLoading(false)
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) console.error('[Auth] SignOut error:', error.message)
      return { error }
    } catch (e) {
      console.error('[Auth] SignOut exception:', e)
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

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import {
  getMe,
  login as apiLogin,
  signup as apiSignup,
  updateProfile as updateProfileApi,
} from '../api/auth'
import type { AuthUser, ProfileUpdatePayload, SignupPayload } from '../api/auth'

type RefreshUserResult = AuthUser | null

const STORAGE_KEY = 'vorton_auth_token'
const STORAGE_USER_KEY = 'vorton_auth_user'

type AuthState = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (emailOrPhone: string, password: string) => Promise<void>
  signup: (data: SignupPayload) => Promise<{ hasSession: boolean }>
  logout: () => void
  clearError: () => void
  /** Refetch profile (e.g. reward points) from GET /auth/me */
  refreshUser: () => Promise<RefreshUserResult>
  /** PATCH profile (address, phone, etc.) — updates stored user */
  updateProfile: (payload: ProfileUpdatePayload) => Promise<void>
  /** Replace user in memory + localStorage (e.g. after email confirm) */
  syncUser: (u: AuthUser) => void
}

const AuthContext = createContext<AuthState | null>(null)

function getStoredToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  } catch {
    return null
  }
}

function isAuthInvalidError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : ''
  return (
      msg === 'Invalid credentials' ||
      msg === 'Account not found' ||
      msg === 'Invalid or expired token' ||
      msg === 'Please sign in again.'
  )
}

function clearStoredSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_USER_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function bootstrap() {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_USER_KEY) : null
      if (!stored) {
        setLoading(false)
        return
      }
      setToken(stored)
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as AuthUser)
        } catch {
          setUser(null)
        }
        setLoading(false)
        // Refresh from GET /auth/me so PostgreSQL fields (e.g. second_email) are not stuck on an old localStorage snapshot.
        void (async () => {
          try {
            const me = await getMe(stored)
            setUser(me)
            if (typeof window !== 'undefined') localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(me))
          } catch (e) {
            if (isAuthInvalidError(e)) {
              clearStoredSession()
              setToken(null)
              setUser(null)
            }
          }
        })()
        return
      }
      try {
        const me = await getMe(stored)
        setUser(me)
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(me))
      } catch {
        // Keep token so protected routes still work (orders API validates token)
      } finally {
        setLoading(false)
      }
    }
    void bootstrap()
  }, [])

  const login = useCallback(async (emailOrPhone: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      const res = await apiLogin(emailOrPhone, password)
      if (res.token) {
        const me = res.user
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, res.token)
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(me))
        }
        setToken(res.token)
        setUser(me)
        void (async () => {
          try {
            const fresh = await getMe(res.token)
            setUser(fresh)
            if (typeof window !== 'undefined') localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(fresh))
          } catch {
            /* keep login payload if /me unavailable */
          }
        })()
      } else {
        setError('Sign-in could not be completed. No token in response.')
        throw new Error('Sign-in could not be completed. No token in response.')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async (data: SignupPayload): Promise<{ hasSession: boolean }> => {
    setError(null)
    setLoading(true)
    try {
      const res = await apiSignup(data)
      if (res.token) {
        const me = res.user
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, res.token)
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(me))
        }
        setToken(res.token)
        setUser(me)
        void (async () => {
          try {
            const fresh = await getMe(res.token)
            setUser(fresh)
            if (typeof window !== 'undefined') localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(fresh))
          } catch {
            /* keep signup payload if /me unavailable */
          }
        })()
        return { hasSession: true }
      }
      return { hasSession: false }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-up failed'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_USER_KEY)
    }
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const refreshUser = useCallback(async (): Promise<RefreshUserResult> => {
    const t = token ?? getStoredToken()
    if (!t) return null
    try {
      const me = await getMe(t)
      setUser(me)
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(me))
      return me
    } catch (e) {
      if (isAuthInvalidError(e)) {
        clearStoredSession()
        setToken(null)
        setUser(null)
      }
      return null
    }
  }, [token])

  const updateProfile = useCallback(
    async (payload: ProfileUpdatePayload) => {
      const t = token ?? getStoredToken()
      if (!t) throw new Error('Not signed in')
      const me = await updateProfileApi(t, payload)
      setUser(me)
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(me))
    },
    [token]
  )

  const syncUser = useCallback((u: AuthUser) => {
    setUser(u)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(u))
  }, [])

  const value: AuthState = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    error,
    login,
    signup,
    logout,
    clearError,
    refreshUser,
    updateProfile,
    syncUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

'use client'

import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextValue {
  token: string | null
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  // loginUser holds the user set directly via login() before the query resolves
  const [loginUser, setLoginUser] = useState<User | null>(null)

  const hasToken = token !== null

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: hasToken,
    retry: false,
  })

  // Derive user and loading from query state
  const user = useMemo(() => {
    if (loginUser) return loginUser
    if (hasToken && meQuery.data) return meQuery.data as User
    return null
  }, [loginUser, hasToken, meQuery.data])

  const loading = hasToken && !loginUser && meQuery.isLoading

  // Handle invalid token: if query errored, clear token on next render
  if (hasToken && meQuery.isError && !loginUser) {
    // Schedule cleanup without using useEffect
    queueMicrotask(() => {
      localStorage.removeItem('token')
      setToken(null)
    })
  }

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setLoginUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setLoginUser(null)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

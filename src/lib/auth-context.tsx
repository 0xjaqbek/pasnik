'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: token !== null,
    retry: false,
  })

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (stored) {
      setToken(stored)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) return

    if (meQuery.data) {
      setUser(meQuery.data as User)
      setLoading(false)
    } else if (meQuery.data === null || meQuery.isError) {
      // Token invalid
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      setLoading(false)
    }
  }, [token, meQuery.data, meQuery.isError])

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
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

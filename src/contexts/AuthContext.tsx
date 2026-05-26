import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadAuthUserId, saveAuthUserId } from '../lib/storage'
import type { User, UserRole } from '../types'
import { useData } from './DataContext'

interface AuthContextValue {
  user: User | null
  login: (username: string, password: string) => string | null
  logout: () => void
  isAdmin: boolean
  canAccess: (roles?: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, loading } = useData()
  const [userId, setUserId] = useState<string | null>(() => loadAuthUserId())

  useEffect(() => {
    if (loading) return
    if (userId && !data.users.some((u) => u.id === userId)) {
      setUserId(null)
      saveAuthUserId(null)
    }
  }, [loading, userId, data.users])

  const user = useMemo(
    () => data.users.find((u) => u.id === userId && u.status === 'actif') ?? null,
    [data.users, userId],
  )

  const login = useCallback(
    (username: string, password: string): string | null => {
      const ident = username.trim()
      const pass = password.trim()
      const found = data.users.find(
        (u) =>
          u.status === 'actif' &&
          (u.username?.toLowerCase() === ident.toLowerCase() ||
            u.email?.toLowerCase() === ident.toLowerCase()) &&
          u.password === pass,
      )
      if (!found) return 'Identifiants incorrects ou compte inactif.'
      setUserId(found.id)
      saveAuthUserId(found.id)
      return null
    },
    [data.users],
  )

  const logout = useCallback(() => {
    setUserId(null)
    saveAuthUserId(null)
  }, [])

  const isAdmin = user?.role === 'admin'

  const canAccess = useCallback(
    (roles?: UserRole[]) => {
      if (!user) return false
      if (!roles || roles.length === 0) return true
      if (user.role === 'admin') return true
      return roles.includes(user.role)
    },
    [user],
  )

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, canAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

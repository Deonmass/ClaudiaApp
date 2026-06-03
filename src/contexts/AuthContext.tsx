import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  canAccessModule,
  defaultPermissionsForRole,
  type PermissionAction,
  type PermissionModuleId,
} from '../lib/permissions'
import { loadAuthUserId, saveAuthUserId } from '../lib/storage'
import type { User, UserRole } from '../types'
import { useData } from './DataContext'

interface AuthContextValue {
  user: User | null
  login: (username: string, password: string) => string | null
  logout: () => void
  isAdmin: boolean
  /** Compatibilité rôles (si pas de permissions explicites) */
  canAccess: (roles?: UserRole[]) => boolean
  canAccessModule: (moduleId: PermissionModuleId) => boolean
  canPerform: (moduleId: PermissionModuleId, action: PermissionAction) => boolean
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
      if (user.role === 'admin') return true
      if (!roles || roles.length === 0) return true
      if (user.permissions && Object.keys(user.permissions).length > 0) {
        return roles.includes(user.role)
      }
      return roles.includes(user.role)
    },
    [user],
  )

  const canAccessModuleFn = useCallback(
    (moduleId: PermissionModuleId) => canAccessModule(user, moduleId),
    [user],
  )

  const canPerform = useCallback(
    (moduleId: PermissionModuleId, action: PermissionAction) => {
      if (!user) return false
      if (user.role === 'admin') return true
      const perms =
        user.permissions && Object.keys(user.permissions).length > 0
          ? user.permissions
          : defaultPermissionsForRole(user.role)
      return Boolean(perms[moduleId]?.[action])
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin,
        canAccess,
        canAccessModule: canAccessModuleFn,
        canPerform,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

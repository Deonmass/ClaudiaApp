import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types'

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, canAccess } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (roles && !canAccess(roles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

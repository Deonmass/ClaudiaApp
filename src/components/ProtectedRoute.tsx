import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { PermissionAction, PermissionModuleId } from '../lib/permissions'
import type { UserRole } from '../types'

export function ProtectedRoute({
  roles,
  module,
  action = 'view',
}: {
  roles?: UserRole[]
  module?: PermissionModuleId
  action?: PermissionAction
}) {
  const { user, canAccess, canAccessModule, canPerform, isAdmin } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (isAdmin) return <Outlet />

  if (module) {
    const allowed =
      action === 'view' || action === 'view_closed' || action === 'view_report'
        ? canAccessModule(module)
        : canPerform(module, action)
    if (!allowed) return <Navigate to="/dashboard" replace />
  }

  if (roles && !canAccess(roles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

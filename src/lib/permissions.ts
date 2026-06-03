import type { CashType, User, UserRole } from '../types'

export type PermissionModuleId =
  | 'dashboard'
  | 'projects'
  | 'clients'
  | 'agents'
  | 'cash'
  | 'attendance'
  | 'settings'

export type PermissionAction =
  | 'view'
  | 'view_closed'
  | 'view_report'
  | 'create'
  | 'edit'
  | 'delete'
  | 'archive'
  | 'cash_entree'
  | 'cash_sortie'
  | 'export'

export type UserPermissions = Partial<
  Record<PermissionModuleId, Partial<Record<PermissionAction, boolean>>>
>

export const PERMISSION_MODULES: {
  id: PermissionModuleId
  label: string
  actions: { key: PermissionAction; label: string }[]
}[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    actions: [{ key: 'view', label: 'Voir' }],
  },
  {
    id: 'projects',
    label: 'Projets',
    actions: [
      { key: 'view', label: 'Voir les projets en cours' },
      { key: 'view_closed', label: 'Voir les projets clôturés' },
      { key: 'create', label: 'Créer un projet' },
      { key: 'edit', label: 'Modifier' },
      { key: 'delete', label: 'Supprimer' },
      { key: 'archive', label: 'Clôturer / archiver' },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    actions: [
      { key: 'view', label: 'Voir' },
      { key: 'create', label: 'Créer' },
      { key: 'edit', label: 'Modifier' },
      { key: 'delete', label: 'Supprimer' },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    actions: [
      { key: 'view', label: 'Voir' },
      { key: 'create', label: 'Créer' },
      { key: 'edit', label: 'Modifier' },
      { key: 'delete', label: 'Désactiver' },
    ],
  },
  {
    id: 'cash',
    label: 'Caisse',
    actions: [
      { key: 'view', label: 'Voir' },
      { key: 'create', label: 'Enregistrer une opération' },
      { key: 'edit', label: 'Modifier' },
      { key: 'delete', label: 'Supprimer' },
      { key: 'cash_entree', label: "Effectuer une opération d'entrée" },
      { key: 'cash_sortie', label: "Effectuer une opération de sortie" },
    ],
  },
  {
    id: 'attendance',
    label: 'Pointage',
    actions: [
      { key: 'view', label: 'Voir la grille mensuelle' },
      { key: 'view_report', label: 'Voir le rapport des présences' },
      { key: 'edit', label: 'Modifier les présences' },
      { key: 'export', label: 'Exporter le rapport' },
    ],
  },
  {
    id: 'settings',
    label: 'Paramètres',
    actions: [
      { key: 'view', label: 'Voir' },
      { key: 'edit', label: 'Modifier' },
    ],
  },
]

export function parsePermissions(raw: string | null | undefined): UserPermissions | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as UserPermissions
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

export function serializePermissions(perms: UserPermissions | null | undefined): string | null {
  if (!perms || Object.keys(perms).length === 0) return null
  return JSON.stringify(perms)
}

export function defaultPermissionsForRole(role: UserRole): UserPermissions {
  const all = (actions: PermissionAction[]): UserPermissions[PermissionModuleId] =>
    Object.fromEntries(actions.map((a) => [a, true])) as Partial<
      Record<PermissionAction, boolean>
    >

  if (role === 'admin') {
    return Object.fromEntries(
      PERMISSION_MODULES.map((m) => [
        m.id,
        all(m.actions.map((a) => a.key)),
      ]),
    ) as UserPermissions
  }

  if (role === 'superviseur') {
    return {
      dashboard: { view: true },
      projects: {
        view: true,
        view_closed: true,
        create: true,
        edit: true,
        archive: true,
      },
      clients: { view: true, create: true, edit: true },
      agents: { view: true, create: true, edit: true },
      cash: {
        view: true,
        create: true,
        edit: true,
        cash_entree: true,
        cash_sortie: true,
      },
      attendance: { view: true, view_report: true, edit: true, export: true },
    }
  }

  if (role === 'caissier') {
    return {
      dashboard: { view: true },
      projects: { view: true },
      cash: {
        view: true,
        create: true,
        edit: true,
        cash_entree: true,
        cash_sortie: true,
      },
    }
  }

  return {
    dashboard: { view: true },
    projects: { view: true },
    attendance: { view: true, edit: true },
  }
}

export function hasPermission(
  user: User | null | undefined,
  moduleId: PermissionModuleId,
  action: PermissionAction,
): boolean {
  if (!user || user.status !== 'actif') return false
  if (user.role === 'admin') return true

  const perms = user.permissions ?? defaultPermissionsForRole(user.role)
  return Boolean(perms[moduleId]?.[action])
}

export function canAccessModule(
  user: User | null | undefined,
  moduleId: PermissionModuleId,
): boolean {
  if (!user || user.status !== 'actif') return false
  if (user.role === 'admin') return true

  if (moduleId === 'projects') {
    return (
      hasPermission(user, 'projects', 'view') ||
      hasPermission(user, 'projects', 'view_closed')
    )
  }

  if (moduleId === 'attendance') {
    return (
      hasPermission(user, 'attendance', 'view') ||
      hasPermission(user, 'attendance', 'view_report')
    )
  }

  if (moduleId === 'cash') {
    return (
      hasPermission(user, 'cash', 'view') ||
      hasPermission(user, 'cash', 'create') ||
      hasPermission(user, 'cash', 'cash_entree') ||
      hasPermission(user, 'cash', 'cash_sortie')
    )
  }

  return hasPermission(user, moduleId, 'view')
}

/** Historique, totaux et liste des mouvements */
export function canViewCashHistory(user: User | null | undefined): boolean {
  if (!user || user.status !== 'actif') return false
  if (user.role === 'admin') return true
  return hasPermission(user, 'cash', 'view')
}

export function canOperateCash(user: User | null | undefined): boolean {
  if (!user || user.status !== 'actif') return false
  if (user.role === 'admin') return true
  return (
    hasPermission(user, 'cash', 'create') ||
    hasPermission(user, 'cash', 'cash_entree') ||
    hasPermission(user, 'cash', 'cash_sortie')
  )
}

export function allowedCashTypesForUser(user: User | null | undefined): CashType[] {
  if (!user || user.role === 'admin') return ['entree', 'sortie']
  const types: CashType[] = []
  if (hasPermission(user, 'cash', 'cash_entree')) types.push('entree')
  if (hasPermission(user, 'cash', 'cash_sortie')) types.push('sortie')
  if (types.length === 0 && hasPermission(user, 'cash', 'create')) {
    return ['entree', 'sortie']
  }
  return types
}

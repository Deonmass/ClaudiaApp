export type UserRole = 'admin' | 'agent' | 'caissier' | 'superviseur'
export type UserStatus = 'actif' | 'inactif'
export type ProjectStatus = 'actif' | 'termine' | 'en_pause'
export type CashType = 'entree' | 'sortie'
export type AttendanceStatus = 'present' | 'absent' | 'retard' | 'malade'
import type { UserPermissions } from '../lib/permissions'

export type Currency = 'USD'

export interface User {
  id: string
  fullName: string
  email: string
  username: string
  phone: string
  role: UserRole
  password: string
  status: UserStatus
  /** JSON des droits par module (colonne Supabase `permissions`) */
  permissions?: UserPermissions | null
}

export type { PermissionAction, PermissionModuleId, UserPermissions } from '../lib/permissions'

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  address?: string
  notes?: string
  internalRef?: string
  createdAt: string
  active: boolean
}

export interface Project {
  id: string
  name: string
  code: string
  description?: string
  clientId?: string
  /** Nom du client (jointure ou enrichissement depuis `clients`) */
  clientName?: string
  managerId: string
  startDate: string
  endDate?: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface CashMovement {
  id: string
  projectId: string
  type: CashType
  amount: number
  /** Motif de l'opération */
  description: string
  date: string
  agentId: string
  /** Source des fonds (entrées) */
  source?: string
  /** Bénéficiaire (sorties) */
  beneficiary?: string
}

export interface AttendanceRecord {
  id: string
  agentId: string
  projectId?: string
  date: string
  status: AttendanceStatus
  notes?: string
}

export interface AppSettings {
  companyName: string
  logo?: string
  address: string
  phone: string
  currency: Currency
  workStart: string
  workEnd: string
}

export interface AppData {
  users: User[]
  clients: Client[]
  projects: Project[]
  cashMovements: CashMovement[]
  attendance: AttendanceRecord[]
  settings: AppSettings
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  agent: 'Agent',
  caissier: 'Caissier',
  superviseur: 'Superviseur',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  actif: 'Actif',
  termine: 'Terminé',
  en_pause: 'En pause',
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Présent',
  absent: 'Absent',
  retard: 'En retard',
  malade: 'Malade',
}

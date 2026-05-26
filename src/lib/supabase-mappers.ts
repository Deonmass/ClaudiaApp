import type {
  AppData,
  AppSettings,
  AttendanceRecord,
  CashMovement,
  Client,
  Project,
  User,
} from '../types'
import { defaultSettings } from './utils'

type UserRow = {
  id: string
  full_name: string
  email: string
  username: string
  phone: string
  role: User['role']
  password: string
  status: User['status']
}

type ClientRow = {
  id: string
  name: string
  phone: string
  email: string
  address: string | null
  notes: string | null
  internal_ref: string | null
  active: boolean
  created_at: string
}

type ProjectRow = {
  id: string
  name: string
  code: string
  description: string | null
  manager_id: string
  start_date: string
  end_date: string | null
  status: Project['status']
  created_at: string
  updated_at: string
}

type CashMovementRow = {
  id: string
  project_id: string
  type: CashMovement['type']
  amount: number
  description: string
  date: string
  agent_id: string
  source: string | null
  beneficiary: string | null
}

type AttendanceRow = {
  id: string
  agent_id: string
  project_id: string | null
  date: string
  status: AttendanceRecord['status']
  notes: string | null
}

type AppSettingsRow = {
  id: number
  company_name: string
  logo: string | null
  address: string
  phone: string
  currency: AppSettings['currency']
  work_start: string
  work_end: string
}

function timeToHm(value: string): string {
  return value.slice(0, 5)
}

function hmToTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}

export function userFromRow(row: UserRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    username: row.username,
    phone: row.phone,
    role: row.role,
    password: row.password,
    status: row.status,
  }
}

export function userToRow(user: Partial<User> & Pick<User, 'fullName' | 'email' | 'username' | 'role' | 'password' | 'status'>) {
  return {
    full_name: user.fullName,
    email: user.email,
    username: user.username,
    phone: user.phone ?? '',
    role: user.role,
    password: user.password,
    status: user.status,
  }
}

export function clientFromRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    internalRef: row.internal_ref ?? undefined,
    createdAt: row.created_at,
    active: row.active,
  }
}

export function clientToRow(
  client: Partial<Client> & Pick<Client, 'name' | 'phone' | 'email' | 'active'>,
) {
  return {
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address ?? null,
    notes: client.notes ?? null,
    internal_ref: client.internalRef ?? null,
    active: client.active,
  }
}

export function projectFromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description ?? undefined,
    managerId: row.manager_id,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function projectToRow(
  project: Partial<Project> &
    Pick<Project, 'name' | 'managerId' | 'startDate' | 'status'>,
) {
  return {
    name: project.name,
    code: project.code,
    description: project.description ?? null,
    manager_id: project.managerId,
    start_date: project.startDate,
    end_date: project.endDate ?? null,
    status: project.status,
  }
}

export function cashMovementFromRow(row: CashMovementRow): CashMovement {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    date: row.date,
    agentId: row.agent_id,
    source: row.source ?? undefined,
    beneficiary: row.beneficiary ?? undefined,
  }
}

export function cashMovementToRow(
  movement: Partial<CashMovement> &
    Pick<CashMovement, 'projectId' | 'type' | 'amount' | 'description' | 'date' | 'agentId'>,
) {
  return {
    project_id: movement.projectId,
    type: movement.type,
    amount: movement.amount,
    description: movement.description,
    date: movement.date,
    agent_id: movement.agentId,
    source: movement.source ?? null,
    beneficiary: movement.beneficiary ?? null,
  }
}

export function attendanceFromRow(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    agentId: row.agent_id,
    projectId: row.project_id ?? undefined,
    date: row.date,
    status: row.status,
    notes: row.notes ?? undefined,
  }
}

export function attendanceToRow(
  record: Partial<AttendanceRecord> &
    Pick<AttendanceRecord, 'agentId' | 'date' | 'status'>,
) {
  return {
    agent_id: record.agentId,
    project_id: record.projectId ?? null,
    date: record.date,
    status: record.status,
    notes: record.notes ?? null,
  }
}

export function settingsFromRow(row: AppSettingsRow | null): AppSettings {
  if (!row) return defaultSettings()
  return {
    companyName: row.company_name,
    logo: row.logo ?? undefined,
    address: row.address,
    phone: row.phone,
    currency: row.currency,
    workStart: timeToHm(row.work_start),
    workEnd: timeToHm(row.work_end),
  }
}

export function settingsToRow(settings: AppSettings) {
  return {
    id: 1,
    company_name: settings.companyName,
    logo: settings.logo ?? null,
    address: settings.address,
    phone: settings.phone,
    currency: settings.currency,
    work_start: hmToTime(settings.workStart),
    work_end: hmToTime(settings.workEnd),
  }
}

export function appDataFromRows(rows: {
  users: UserRow[]
  clients: ClientRow[]
  projects: ProjectRow[]
  cashMovements: CashMovementRow[]
  attendance: AttendanceRow[]
  settings: AppSettingsRow | null
}): AppData {
  return {
    users: rows.users.map(userFromRow),
    clients: rows.clients.map(clientFromRow),
    projects: rows.projects.map(projectFromRow),
    cashMovements: rows.cashMovements.map(cashMovementFromRow),
    attendance: rows.attendance.map(attendanceFromRow),
    settings: settingsFromRow(rows.settings),
  }
}

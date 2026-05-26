import { supabase } from './supabase'
import {
  appDataFromRows,
  attendanceFromRow,
  attendanceToRow,
  cashMovementFromRow,
  cashMovementToRow,
  clientFromRow,
  clientToRow,
  projectFromRow,
  projectToRow,
  settingsFromRow,
  settingsToRow,
  userFromRow,
  userToRow,
} from './supabase-mappers'
import type {
  AppData,
  AppSettings,
  AttendanceRecord,
  CashMovement,
  Client,
  Project,
  User,
} from '../types'

export async function fetchAppData(): Promise<AppData> {
  const [users, clients, projects, cashMovements, attendance, settings] =
    await Promise.all([
      supabase.from('users').select('*').order('full_name'),
      supabase.from('clients').select('*').order('name'),
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('cash_movements').select('*').order('date', { ascending: false }),
      supabase.from('attendance_records').select('*').order('date'),
      supabase.from('app_settings').select('*').eq('id', 1).maybeSingle(),
    ])

  const tables = [
    ['users', users],
    ['clients', clients],
    ['projects', projects],
    ['cash_movements', cashMovements],
    ['attendance_records', attendance],
    ['app_settings', settings],
  ] as const

  for (const [name, res] of tables) {
    if (res.error) {
      throw new Error(`${name}: ${res.error.message}`)
    }
  }

  return appDataFromRows({
    users: users.data ?? [],
    clients: clients.data ?? [],
    projects: projects.data ?? [],
    cashMovements: cashMovements.data ?? [],
    attendance: attendance.data ?? [],
    settings: settings.data,
  })
}

export async function updateSettingsDb(settings: AppSettings): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .upsert(settingsToRow(settings))
    .select('*')
    .single()
  if (error) throw error
  return settingsFromRow(data)
}

export async function insertClientDb(
  client: Omit<Client, 'id' | 'createdAt' | 'active'>,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...clientToRow({ ...client, active: true }), created_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  return clientFromRow(data)
}

export async function updateClientDb(id: string, patch: Partial<Client>): Promise<Client> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.phone !== undefined) row.phone = patch.phone
  if (patch.email !== undefined) row.email = patch.email
  if (patch.address !== undefined) row.address = patch.address ?? null
  if (patch.notes !== undefined) row.notes = patch.notes ?? null
  if (patch.internalRef !== undefined) row.internal_ref = patch.internalRef ?? null
  if (patch.active !== undefined) row.active = patch.active

  const { data, error } = await supabase
    .from('clients')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return clientFromRow(data)
}

export async function insertUserDb(user: Omit<User, 'id'>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert(userToRow(user))
    .select('*')
    .single()
  if (error) throw error
  return userFromRow(data)
}

export async function updateUserDb(id: string, patch: Partial<User>): Promise<User> {
  const row: Record<string, unknown> = {}
  if (patch.fullName !== undefined) row.full_name = patch.fullName
  if (patch.email !== undefined) row.email = patch.email
  if (patch.username !== undefined) row.username = patch.username
  if (patch.phone !== undefined) row.phone = patch.phone
  if (patch.role !== undefined) row.role = patch.role
  if (patch.password !== undefined) row.password = patch.password
  if (patch.status !== undefined) row.status = patch.status

  const { data, error } = await supabase
    .from('users')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return userFromRow(data)
}

export async function insertProjectDb(project: Project): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      id: project.id,
      ...projectToRow(project),
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    })
    .select('*')
    .single()
  if (error) throw error
  return projectFromRow(data)
}

export async function updateProjectDb(id: string, patch: Partial<Project>): Promise<Project> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.code !== undefined) row.code = patch.code
  if (patch.description !== undefined) row.description = patch.description ?? null
  if (patch.managerId !== undefined) row.manager_id = patch.managerId
  if (patch.startDate !== undefined) row.start_date = patch.startDate
  if (patch.endDate !== undefined) row.end_date = patch.endDate ?? null
  if (patch.status !== undefined) row.status = patch.status

  const { data, error } = await supabase
    .from('projects')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return projectFromRow(data)
}

export async function insertCashMovementDb(
  movement: Omit<CashMovement, 'id'>,
): Promise<CashMovement> {
  const { data, error } = await supabase
    .from('cash_movements')
    .insert(cashMovementToRow(movement))
    .select('*')
    .single()
  if (error) throw error
  return cashMovementFromRow(data)
}

export async function updateCashMovementDb(
  id: string,
  patch: Partial<CashMovement>,
): Promise<CashMovement> {
  const row: Record<string, unknown> = {}
  if (patch.projectId !== undefined) row.project_id = patch.projectId
  if (patch.type !== undefined) row.type = patch.type
  if (patch.amount !== undefined) row.amount = patch.amount
  if (patch.description !== undefined) row.description = patch.description
  if (patch.date !== undefined) row.date = patch.date
  if (patch.agentId !== undefined) row.agent_id = patch.agentId
  if (patch.source !== undefined) row.source = patch.source ?? null
  if (patch.beneficiary !== undefined) row.beneficiary = patch.beneficiary ?? null

  const { data, error } = await supabase
    .from('cash_movements')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return cashMovementFromRow(data)
}

export async function deleteCashMovementDb(id: string): Promise<void> {
  const { error } = await supabase.from('cash_movements').delete().eq('id', id)
  if (error) throw error
}

export async function upsertAttendanceDb(
  records: AttendanceRecord[],
): Promise<AttendanceRecord[]> {
  if (records.length === 0) return []
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(records.map(attendanceToRow), { onConflict: 'agent_id,date' })
    .select('*')
  if (error) throw error
  return (data ?? []).map(attendanceFromRow)
}

export async function deleteAttendanceCellDb(
  agentId: string,
  date: string,
): Promise<void> {
  const { error } = await supabase
    .from('attendance_records')
    .delete()
    .eq('agent_id', agentId)
    .eq('date', date)
  if (error) throw error
}

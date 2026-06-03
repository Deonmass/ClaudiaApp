import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  deleteAttendanceCellDb,
  deleteCashMovementDb,
  deleteUserDb,
  fetchAppData,
  insertCashMovementDb,
  insertClientDb,
  insertProjectDb,
  insertUserDb,
  updateCashMovementDb,
  updateClientDb,
  updateProjectDb,
  updateSettingsDb,
  updateUserDb,
  upsertAttendanceDb,
} from '../lib/supabase-data'
import { enrichProjectWithClient } from '../lib/supabase-mappers'
import {
  formatSupabaseError,
  isSupabaseSchemaError,
} from '../lib/supabase-errors'
import { generateId, projectCode } from '../lib/utils'
import type {
  AppData,
  AppSettings,
  AttendanceRecord,
  CashMovement,
  Client,
  Project,
  ProjectStatus,
  User,
} from '../types'

interface DataContextValue {
  data: AppData
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  updateSettings: (settings: AppSettings) => Promise<void>
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'active'>) => Promise<void>
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  addUser: (user: Omit<User, 'id'>) => Promise<User>
  updateUser: (id: string, patch: Partial<User>) => Promise<User>
  deactivateUser: (id: string) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  addProject: (
    project: Omit<Project, 'id' | 'code' | 'createdAt' | 'updatedAt'>,
  ) => Promise<void>
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>
  archiveProject: (id: string) => Promise<void>
  addCashMovement: (movement: Omit<CashMovement, 'id'>) => Promise<void>
  updateCashMovement: (id: string, patch: Partial<CashMovement>) => Promise<void>
  deleteCashMovement: (id: string) => Promise<void>
  upsertAttendance: (
    date: string,
    records: Omit<AttendanceRecord, 'id'>[],
  ) => Promise<void>
  setAttendanceCell: (
    agentId: string,
    date: string,
    payload: { status: AttendanceRecord['status']; notes?: string } | null,
  ) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

function emptyData(): AppData {
  return {
    users: [],
    clients: [],
    projects: [],
    cashMovements: [],
    attendance: [],
    settings: {
      companyName: '',
      address: '',
      phone: '',
      currency: 'USD',
      workStart: '08:00',
      workEnd: '17:00',
    },
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const next = await fetchAppData()
      setData(next)
    } catch (e) {
      setError(formatSupabaseError(e))
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateSettings = useCallback(async (settings: AppSettings) => {
    const saved = await updateSettingsDb(settings)
    setData((d) => ({ ...d, settings: saved }))
  }, [])

  const addClient = useCallback(
    async (client: Omit<Client, 'id' | 'createdAt' | 'active'>) => {
      const created = await insertClientDb(client)
      setData((d) => ({ ...d, clients: [...d.clients, created] }))
    },
    [],
  )

  const updateClient = useCallback(async (id: string, patch: Partial<Client>) => {
    const updated = await updateClientDb(id, patch)
    setData((d) => ({
      ...d,
      clients: d.clients.map((c) => (c.id === id ? updated : c)),
    }))
  }, [])

  const deleteClient = useCallback(async (id: string) => {
    const updated = await updateClientDb(id, { active: false })
    setData((d) => ({
      ...d,
      clients: d.clients.map((c) => (c.id === id ? updated : c)),
    }))
  }, [])

  const addUser = useCallback(async (user: Omit<User, 'id'>) => {
    const created = await insertUserDb(user)
    setData((d) => ({ ...d, users: [...d.users, created] }))
    return created
  }, [])

  const updateUser = useCallback(async (id: string, patch: Partial<User>) => {
    const updated = await updateUserDb(id, patch)
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? updated : u)),
    }))
    return updated
  }, [])

  const deactivateUser = useCallback(async (id: string) => {
    const updated = await updateUserDb(id, { status: 'inactif' })
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? updated : u)),
    }))
  }, [])

  const deleteUser = useCallback(async (id: string) => {
    await deleteUserDb(id)
    setData((d) => ({
      ...d,
      users: d.users.filter((u) => u.id !== id),
    }))
  }, [])

  const addProject = useCallback(
    async (
      project: Omit<Project, 'id' | 'code' | 'createdAt' | 'updatedAt'>,
    ) => {
      const year = new Date().getFullYear()
      const existing = data.projects.filter((p) =>
        p.code.startsWith(`PROJ-${year}-`),
      ).length
      const now = new Date().toISOString()
      const created = enrichProjectWithClient(
        await insertProjectDb({
          ...project,
          id: generateId(),
          code: projectCode(year, existing + 1),
          createdAt: now,
          updatedAt: now,
        }),
        data.clients,
      )
      setData((d) => ({ ...d, projects: [...d.projects, created] }))
    },
    [data.projects, data.clients],
  )

  const updateProject = useCallback(async (id: string, patch: Partial<Project>) => {
    const updated = enrichProjectWithClient(
      await updateProjectDb(id, patch),
      data.clients,
    )
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) => (p.id === id ? updated : p)),
    }))
  }, [data.clients])

  const archiveProject = useCallback(
    (id: string) => updateProject(id, { status: 'termine' as ProjectStatus }),
    [updateProject],
  )

  const addCashMovement = useCallback(async (movement: Omit<CashMovement, 'id'>) => {
    const created = await insertCashMovementDb(movement)
    setData((d) => ({
      ...d,
      cashMovements: [...d.cashMovements, created],
    }))
  }, [])

  const updateCashMovement = useCallback(async (id: string, patch: Partial<CashMovement>) => {
    const updated = await updateCashMovementDb(id, patch)
    setData((d) => ({
      ...d,
      cashMovements: d.cashMovements.map((m) => (m.id === id ? updated : m)),
    }))
  }, [])

  const deleteCashMovement = useCallback(async (id: string) => {
    await deleteCashMovementDb(id)
    setData((d) => ({
      ...d,
      cashMovements: d.cashMovements.filter((m) => m.id !== id),
    }))
  }, [])

  const upsertAttendance = useCallback(
    async (date: string, records: Omit<AttendanceRecord, 'id'>[]) => {
      const withIds = records.map((r) => ({
        ...r,
        id:
          data.attendance.find(
            (a) => a.date === date && a.agentId === r.agentId,
          )?.id ?? generateId(),
      }))
      const saved = await upsertAttendanceDb(withIds)
      const others = data.attendance.filter((a) => a.date !== date)
      setData((d) => ({ ...d, attendance: [...others, ...saved] }))
    },
    [data.attendance],
  )

  const setAttendanceCell = useCallback(
    async (
      agentId: string,
      date: string,
      payload: { status: AttendanceRecord['status']; notes?: string } | null,
    ) => {
      if (!payload) {
        await deleteAttendanceCellDb(agentId, date)
        setData((d) => ({
          ...d,
          attendance: d.attendance.filter(
            (a) => !(a.agentId === agentId && a.date === date),
          ),
        }))
        return
      }
      const existing = data.attendance.find(
        (a) => a.agentId === agentId && a.date === date,
      )
      const record: AttendanceRecord = {
        id: existing?.id ?? generateId(),
        agentId,
        date,
        status: payload.status,
        notes: payload.notes?.trim() || undefined,
        projectId: existing?.projectId,
      }
      const [saved] = await upsertAttendanceDb([record])
      const others = data.attendance.filter(
        (a) => !(a.agentId === agentId && a.date === date),
      )
      setData((d) => ({ ...d, attendance: [...others, saved] }))
    },
    [data.attendance],
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-400">Chargement des données…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center dark:bg-slate-950">
        <p className="max-w-lg text-red-600 dark:text-red-400">{error}</p>
        {error && isSupabaseSchemaError(error) ? (
          <p className="max-w-lg text-sm text-slate-600 dark:text-slate-400">
            Exécutez le schéma SQL dans Supabase (fichier{' '}
            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
              supabase/schema-complet.sql
            </code>
            ) ou lancez{' '}
            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
              npm run db:migrate
            </code>{' '}
            après avoir ajouté <code>SUPABASE_DB_PASSWORD</code> dans{' '}
            <code>.env</code>.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        refreshing,
        error,
        refresh,
        updateSettings,
        addClient,
        updateClient,
        deleteClient,
        addUser,
        updateUser,
        deactivateUser,
        deleteUser,
        addProject,
        updateProject,
        archiveProject,
        addCashMovement,
        updateCashMovement,
        deleteCashMovement,
        upsertAttendance,
        setAttendanceCell,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

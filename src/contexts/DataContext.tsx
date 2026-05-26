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
  error: string | null
  refresh: () => Promise<void>
  updateSettings: (settings: AppSettings) => void
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'active'>) => void
  updateClient: (id: string, patch: Partial<Client>) => void
  deleteClient: (id: string) => void
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (id: string, patch: Partial<User>) => void
  deleteUser: (id: string) => void
  addProject: (
    project: Omit<Project, 'id' | 'code' | 'createdAt' | 'updatedAt'>,
  ) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  archiveProject: (id: string) => void
  addCashMovement: (movement: Omit<CashMovement, 'id'>) => void
  updateCashMovement: (id: string, patch: Partial<CashMovement>) => void
  deleteCashMovement: (id: string) => void
  upsertAttendance: (
    date: string,
    records: Omit<AttendanceRecord, 'id'>[],
  ) => void
  setAttendanceCell: (
    agentId: string,
    date: string,
    payload: { status: AttendanceRecord['status']; notes?: string } | null,
  ) => void
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
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchAppData()
      setData(next)
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Impossible de charger les données Supabase.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      try {
        await fn()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur Supabase'
        setError(msg)
        throw e
      }
    },
    [],
  )

  const updateSettings = useCallback((settings: AppSettings) => {
    void run(async () => {
      const saved = await updateSettingsDb(settings)
      setData((d) => ({ ...d, settings: saved }))
    })
  }, [run])

  const addClient = useCallback(
    (client: Omit<Client, 'id' | 'createdAt' | 'active'>) => {
      void run(async () => {
        const created = await insertClientDb(client)
        setData((d) => ({ ...d, clients: [...d.clients, created] }))
      })
    },
    [run],
  )

  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    void run(async () => {
      const updated = await updateClientDb(id, patch)
      setData((d) => ({
        ...d,
        clients: d.clients.map((c) => (c.id === id ? updated : c)),
      }))
    })
  }, [run])

  const deleteClient = useCallback((id: string) => {
    void run(async () => {
      const updated = await updateClientDb(id, { active: false })
      setData((d) => ({
        ...d,
        clients: d.clients.map((c) => (c.id === id ? updated : c)),
      }))
    })
  }, [run])

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    void run(async () => {
      const created = await insertUserDb(user)
      setData((d) => ({ ...d, users: [...d.users, created] }))
    })
  }, [run])

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    void run(async () => {
      const updated = await updateUserDb(id, patch)
      setData((d) => ({
        ...d,
        users: d.users.map((u) => (u.id === id ? updated : u)),
      }))
    })
  }, [run])

  const deleteUser = useCallback((id: string) => {
    void run(async () => {
      const updated = await updateUserDb(id, { status: 'inactif' })
      setData((d) => ({
        ...d,
        users: d.users.map((u) => (u.id === id ? updated : u)),
      }))
    })
  }, [run])

  const addProject = useCallback(
    (
      project: Omit<Project, 'id' | 'code' | 'createdAt' | 'updatedAt'>,
    ) => {
      void run(async () => {
        const year = new Date().getFullYear()
        const existing = data.projects.filter((p) =>
          p.code.startsWith(`PROJ-${year}-`),
        ).length
        const now = new Date().toISOString()
        const created = await insertProjectDb({
          ...project,
          id: generateId(),
          code: projectCode(year, existing + 1),
          createdAt: now,
          updatedAt: now,
        })
        setData((d) => ({ ...d, projects: [...d.projects, created] }))
      })
    },
    [run, data.projects],
  )

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    void run(async () => {
      const updated = await updateProjectDb(id, patch)
      setData((d) => ({
        ...d,
        projects: d.projects.map((p) => (p.id === id ? updated : p)),
      }))
    })
  }, [run])

  const archiveProject = useCallback((id: string) => {
    updateProject(id, { status: 'termine' as ProjectStatus })
  }, [updateProject])

  const addCashMovement = useCallback((movement: Omit<CashMovement, 'id'>) => {
    void run(async () => {
      const created = await insertCashMovementDb(movement)
      setData((d) => ({
        ...d,
        cashMovements: [...d.cashMovements, created],
      }))
    })
  }, [run])

  const updateCashMovement = useCallback((id: string, patch: Partial<CashMovement>) => {
    void run(async () => {
      const updated = await updateCashMovementDb(id, patch)
      setData((d) => ({
        ...d,
        cashMovements: d.cashMovements.map((m) => (m.id === id ? updated : m)),
      }))
    })
  }, [run])

  const deleteCashMovement = useCallback((id: string) => {
    void run(async () => {
      await deleteCashMovementDb(id)
      setData((d) => ({
        ...d,
        cashMovements: d.cashMovements.filter((m) => m.id !== id),
      }))
    })
  }, [run])

  const upsertAttendance = useCallback(
    (date: string, records: Omit<AttendanceRecord, 'id'>[]) => {
      void run(async () => {
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
      })
    },
    [run, data.attendance],
  )

  const setAttendanceCell = useCallback(
    (
      agentId: string,
      date: string,
      payload: { status: AttendanceRecord['status']; notes?: string } | null,
    ) => {
      void run(async () => {
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
      })
    },
    [run, data.attendance],
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
        <p className="max-w-lg text-sm text-slate-600 dark:text-slate-400">
          Exécutez le schéma SQL dans Supabase (fichier{' '}
          <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
            supabase/schema-complet.sql
          </code>
          ) ou lancez{' '}
          <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
            npm run db:migrate
          </code>{' '}
          après avoir ajouté <code>SUPABASE_DB_PASSWORD</code> dans <code>.env</code>.
        </p>
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
        error,
        refresh,
        updateSettings,
        addClient,
        updateClient,
        deleteClient,
        addUser,
        updateUser,
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

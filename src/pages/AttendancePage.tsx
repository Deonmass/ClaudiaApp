import clsx from 'clsx'
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEffect, useMemo, useState } from 'react'
import { AttendanceCellModal } from '../components/attendance/AttendanceCellModal'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Input'
import { useData } from '../contexts/DataContext'
import {
  ATTENDANCE_STATUS_CELL,
  ATTENDANCE_STATUS_LETTER,
  ATTENDANCE_STATUSES,
} from '../lib/attendance'
import type { AttendanceStatus } from '../types'
import { ATTENDANCE_STATUS_LABELS } from '../types'

type CellValue = { status: AttendanceStatus; notes?: string }

interface PendingCell {
  agentId: string
  agentName: string
  date: string
}

export function AttendancePage() {
  const { data, setAttendanceCell } = useData()
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [grid, setGrid] = useState<Record<string, Record<string, CellValue | null>>>({})
  const [pending, setPending] = useState<PendingCell | null>(null)

  const yearMonth = `${year}-${month}`

  const activeAgents = useMemo(
    () => data.users.filter((u) => u.status === 'actif' && u.role !== 'admin'),
    [data.users],
  )

  const agentIdsKey = useMemo(
    () => activeAgents.map((a) => a.id).join(','),
    [activeAgents],
  )

  const days = useMemo(() => {
    const monthStart = parseISO(`${yearMonth}-01`)
    const interval = eachDayOfInterval({
      start: startOfMonth(monthStart),
      end: endOfMonth(monthStart),
    })
    return interval.map((d) => ({
      date: format(d, 'yyyy-MM-dd'),
      dayNum: d.getDate(),
      weekday: format(d, 'EEE', { locale: fr }),
      isWeekend: getDay(d) === 0 || getDay(d) === 6,
    }))
  }, [yearMonth])

  const attendanceKey = useMemo(
    () =>
      data.attendance
        .filter((a) => a.date.startsWith(yearMonth))
        .map((a) => `${a.agentId}:${a.date}:${a.status}:${a.notes ?? ''}`)
        .sort()
        .join('|'),
    [data.attendance, yearMonth],
  )

  useEffect(() => {
    const next: Record<string, Record<string, CellValue | null>> = {}
    activeAgents.forEach((agent) => {
      next[agent.id] = {}
      days.forEach((d) => {
        const rec = data.attendance.find(
          (a) => a.agentId === agent.id && a.date === d.date,
        )
        next[agent.id][d.date] = rec
          ? { status: rec.status, notes: rec.notes }
          : null
      })
    })
    setGrid(next)
  }, [yearMonth, agentIdsKey, attendanceKey, activeAgents, days, data.attendance])

  const presentCount = (agentId: string) =>
    days.filter((d) => grid[agentId]?.[d.date]?.status === 'present').length

  const openCell = (agentId: string, agentName: string, date: string) => {
    setPending({ agentId, agentName, date })
  }

  const pendingValue = pending ? grid[pending.agentId]?.[pending.date] : null

  const handleSave = (status: AttendanceStatus, notes: string) => {
    if (!pending) return
    setAttendanceCell(pending.agentId, pending.date, {
      status,
      notes: notes.trim() || undefined,
    })
  }

  const handleClear = () => {
    if (!pending) return
    setAttendanceCell(pending.agentId, pending.date, null)
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: format(parseISO(`2024-${String(i + 1).padStart(2, '0')}-01`), 'MMMM', {
      locale: fr,
    }),
  }))

  const monthLabel = months.find((m) => m.value === month)?.label ?? month

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Pointage mensuel
        </h2>
        <p className="text-sm text-slate-500">
          Cliquez sur une case pour renseigner le statut — {monthLabel} {year}
        </p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <Select label="Mois" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
          <Select label="Année" value={year} onChange={(e) => setYear(e.target.value)}>
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </Select>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          {ATTENDANCE_STATUSES.map((s) => (
            <span
              key={s}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                ATTENDANCE_STATUS_CELL[s].bg,
                ATTENDANCE_STATUS_CELL[s].text,
              )}
            >
              <span className="font-bold">{ATTENDANCE_STATUS_LETTER[s]}</span>
              {ATTENDANCE_STATUS_LABELS[s]}
            </span>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                <th className="sticky left-0 z-[1] min-w-[200px] border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Agent
                </th>
                <th className="sticky left-[200px] z-[1] min-w-[72px] border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center font-semibold text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400">
                  Jours présents
                </th>
                {days.map((d) => (
                  <th
                    key={d.date}
                    className={clsx(
                      'min-w-[36px] border-b border-slate-200 px-0.5 py-2 text-center font-semibold dark:border-slate-700',
                      d.isWeekend
                        ? 'bg-slate-100/80 text-slate-400 dark:bg-slate-800/80'
                        : 'text-slate-600 dark:text-slate-400',
                    )}
                  >
                    <div className="text-[10px] uppercase">{d.weekday}</div>
                    <div>{d.dayNum}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeAgents.map((agent, rowIdx) => (
                <tr
                  key={agent.id}
                  className={clsx(
                    rowIdx % 2 === 0
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/50 dark:bg-slate-900/50',
                  )}
                >
                  <td className="sticky left-0 z-[1] border-r border-slate-100 bg-inherit px-3 py-2 font-medium text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {agent.fullName}
                  </td>
                  <td className="sticky left-[200px] z-[1] border-r border-slate-100 bg-inherit px-2 py-2 text-center font-bold text-emerald-600 dark:border-slate-800 dark:text-emerald-400">
                    {presentCount(agent.id)}
                  </td>
                  {days.map((d) => {
                    const cell = grid[agent.id]?.[d.date]
                    const letter = cell ? ATTENDANCE_STATUS_LETTER[cell.status] : ''
                    const colors = cell ? ATTENDANCE_STATUS_CELL[cell.status] : null
                    return (
                      <td
                        key={d.date}
                        className={clsx(
                          'border-slate-100 p-0.5 text-center dark:border-slate-800',
                          d.isWeekend && 'bg-slate-100/50 dark:bg-slate-800/30',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => openCell(agent.id, agent.fullName, d.date)}
                          title={
                            cell
                              ? `${ATTENDANCE_STATUS_LABELS[cell.status]}${cell.notes ? ` — ${cell.notes}` : ''}`
                              : 'Ajouter un pointage'
                          }
                          className={clsx(
                            'flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold transition-transform hover:scale-105',
                            colors
                              ? clsx(colors.bg, colors.text, colors.hover)
                              : 'border border-dashed border-slate-300 text-slate-300 hover:border-slate-400 hover:text-slate-400 dark:border-slate-600',
                          )}
                          aria-label={`${agent.fullName} — ${format(parseISO(d.date), 'dd/MM/yyyy')}`}
                        >
                          {letter || '·'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          P = Présent, A = Absent, R = En retard, M = Malade. La colonne « Jours présents »
          compte uniquement les P.
        </p>
      </Card>

      {pending && (
        <AttendanceCellModal
          open
          onClose={() => setPending(null)}
          agentName={pending.agentName}
          date={pending.date}
          initialStatus={pendingValue?.status}
          initialNotes={pendingValue?.notes}
          onSave={handleSave}
          onClear={handleClear}
        />
      )}
    </div>
  )
}

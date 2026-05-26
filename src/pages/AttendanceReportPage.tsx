import clsx from 'clsx'
import { format, getDaysInMonth, parseISO } from 'date-fns'
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Input'
import { useData } from '../contexts/DataContext'
import {
  ATTENDANCE_STATUS_CELL,
  ATTENDANCE_STATUS_LETTER,
  ATTENDANCE_STATUSES,
} from '../lib/attendance'
import { downloadCsv } from '../lib/utils'
import { ATTENDANCE_STATUS_LABELS } from '../types'

export function AttendanceReportPage() {
  const { data } = useData()
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(now.getFullYear()))

  const prefix = `${year}-${month}`

  const report = useMemo(() => {
    const daysInMonth = getDaysInMonth(parseISO(`${year}-${month}-01`))
    const agents = data.users.filter((u) => u.status === 'actif' && u.role !== 'admin')

    return agents.map((agent) => {
      const records = data.attendance.filter(
        (a) => a.agentId === agent.id && a.date.startsWith(prefix),
      )
      const present = records.filter((r) => r.status === 'present').length
      const absent = records.filter((r) => r.status === 'absent').length
      const retard = records.filter((r) => r.status === 'retard').length
      const malade = records.filter((r) => r.status === 'malade').length
      const total = records.length
      const rate = total > 0 ? Math.round((present / total) * 100) : 0

      return {
        agent,
        present,
        absent,
        retard,
        malade,
        total,
        rate,
        daysInMonth,
      }
    })
  }, [data, prefix, month, year])

  const totals = useMemo(
    () =>
      report.reduce(
        (acc, r) => ({
          present: acc.present + r.present,
          absent: acc.absent + r.absent,
          retard: acc.retard + r.retard,
          malade: acc.malade + r.malade,
        }),
        { present: 0, absent: 0, retard: 0, malade: 0 },
      ),
    [report],
  )

  const exportCsv = () => {
    const rows: string[][] = [
      [
        'Agent',
        'Présents (P)',
        'Absents (A)',
        'Retards (R)',
        'Malades (M)',
        'Total pointé',
        'Taux présence %',
      ],
    ]
    report.forEach((r) => {
      rows.push([
        r.agent.fullName,
        String(r.present),
        String(r.absent),
        String(r.retard),
        String(r.malade),
        String(r.total),
        String(r.rate),
      ])
    })
    downloadCsv(`rapport-presences-${year}-${month}.csv`, rows)
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: format(parseISO(`2024-${String(i + 1).padStart(2, '0')}-01`), 'MMMM'),
  }))

  const countColor = {
    present: 'text-emerald-600 dark:text-emerald-400',
    absent: 'text-red-600 dark:text-red-400',
    retard: 'text-amber-600 dark:text-amber-400',
    malade: 'text-violet-600 dark:text-violet-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Rapport des présences
          </h2>
          <p className="text-sm text-slate-500">
            Synthèse mensuelle par agent — {months.find((m) => m.value === month)?.label}{' '}
            {year}
          </p>
        </div>
        <Button variant="secondary" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-4">
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

        <div className="mb-6 flex flex-wrap gap-3">
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                  Agent
                </th>
                <th className="px-4 py-3 text-center font-semibold text-emerald-600">P</th>
                <th className="px-4 py-3 text-center font-semibold text-red-600">A</th>
                <th className="px-4 py-3 text-center font-semibold text-amber-600">R</th>
                <th className="px-4 py-3 text-center font-semibold text-violet-600">M</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                  Taux P
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.map((r) => (
                <tr key={r.agent.id}>
                  <td className="px-4 py-3 font-medium">{r.agent.fullName}</td>
                  <td className={clsx('px-4 py-3 text-center font-semibold', countColor.present)}>
                    {r.present}
                  </td>
                  <td className={clsx('px-4 py-3 text-center font-semibold', countColor.absent)}>
                    {r.absent}
                  </td>
                  <td className={clsx('px-4 py-3 text-center font-semibold', countColor.retard)}>
                    {r.retard}
                  </td>
                  <td className={clsx('px-4 py-3 text-center font-semibold', countColor.malade)}>
                    {r.malade}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${r.rate}%` }}
                        />
                      </div>
                      <span>{r.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <td className="px-4 py-3">Total équipe</td>
                <td className={clsx('px-4 py-3 text-center', countColor.present)}>
                  {totals.present}
                </td>
                <td className={clsx('px-4 py-3 text-center', countColor.absent)}>
                  {totals.absent}
                </td>
                <td className={clsx('px-4 py-3 text-center', countColor.retard)}>
                  {totals.retard}
                </td>
                <td className={clsx('px-4 py-3 text-center', countColor.malade)}>
                  {totals.malade}
                </td>
                <td className="px-4 py-3">—</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Taux = Présents (P) ÷ total des jours pointés (P + A + R + M) pour le mois.
        </p>
      </Card>
    </div>
  )
}

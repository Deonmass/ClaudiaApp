import {
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Banknote,
  FolderKanban,
  UserCheck,
  Users,
  UserCog,
} from 'lucide-react'
import { useMemo } from 'react'
import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeading } from '../components/ui/PageHeading'
import { Card, StatCard } from '../components/ui/Card'
import { useFilteredData, useYearFilter } from '../contexts/YearFilterContext'
import { cashBalance, formatMoney } from '../lib/utils'
import { ATTENDANCE_STATUS_LABELS } from '../types'

function chartMoneyLabel(value: unknown): string {
  const n = Number(value)
  if (!n) return ''
  return formatMoney(n)
}

export function DashboardPage() {
  const { selectedYear } = useYearFilter()
  const data = useFilteredData()
  const isCurrentYear = selectedYear === new Date().getFullYear()
  const today = format(new Date(), 'yyyy-MM-dd')

  const stats = useMemo(() => {
    const activeProjects = data.projects.filter((p) => p.status === 'actif').length
    const doneProjects = data.projects.filter((p) => p.status === 'termine').length
    const activeClients = data.clients.filter((c) => c.active).length
    const activeAgents = data.users.filter(
      (u) => u.status === 'actif' && u.role !== 'admin',
    ).length
    const balance = cashBalance(data.cashMovements)

    let yearIn = 0
    let yearOut = 0
    let weekIn = 0
    let weekOut = 0
    let monthIn = 0
    let monthOut = 0

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())

    data.cashMovements.forEach((m) => {
      const d = parseISO(m.date)
      const amt = m.amount
      if (m.type === 'entree') yearIn += amt
      else yearOut += amt

      if (isCurrentYear && isWithinInterval(d, { start: weekStart, end: weekEnd })) {
        if (m.type === 'entree') weekIn += amt
        else weekOut += amt
      }
      if (isCurrentYear && isWithinInterval(d, { start: monthStart, end: monthEnd })) {
        if (m.type === 'entree') monthIn += amt
        else monthOut += amt
      }
    })

    const todayAttendance = isCurrentYear
      ? data.attendance.filter((a) => a.date === today)
      : []
    const present = todayAttendance.filter((a) => a.status === 'present').length
    const absent = todayAttendance.filter((a) => a.status === 'absent').length
    const retard = todayAttendance.filter((a) => a.status === 'retard').length
    const malade = todayAttendance.filter((a) => a.status === 'malade').length

    return {
      activeProjects,
      doneProjects,
      activeClients,
      activeAgents,
      balance,
      yearIn,
      yearOut,
      weekIn,
      weekOut,
      monthIn,
      monthOut,
      present,
      absent,
      retard,
      malade,
    }
  }, [data, today, isCurrentYear])

  const monthlyMovements = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(selectedYear, i, 1))
    const totals = Object.fromEntries(
      months.map((m) => [format(m, 'yyyy-MM'), { entrees: 0, sorties: 0 }]),
    ) as Record<string, { entrees: number; sorties: number }>

    data.cashMovements.forEach((m) => {
      const key = format(parseISO(m.date), 'yyyy-MM')
      if (!totals[key]) return
      if (m.type === 'entree') totals[key].entrees += m.amount
      else totals[key].sorties += m.amount
    })

    return months.map((m) => {
      const key = format(m, 'yyyy-MM')
      const v = totals[key]
      return {
        name: format(m, 'MMM', { locale: fr }),
        Entrées: v.entrees,
        Sorties: v.sorties,
      }
    })
  }, [data.cashMovements, selectedYear])

  return (
    <div className="space-y-6">
      <PageHeading
        title="Tableau de bord"
        description={
          isCurrentYear
            ? `Vue d'ensemble — ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`
            : `Vue d'ensemble — année ${selectedYear}`
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Projets actifs"
          value={stats.activeProjects}
          sub={`${stats.doneProjects} terminés`}
          icon={<FolderKanban className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Clients"
          value={stats.activeClients}
          icon={<Users className="h-5 w-5" />}
          accent="green"
        />
        <StatCard
          label="Agents actifs"
          value={stats.activeAgents}
          icon={<UserCog className="h-5 w-5" />}
          accent="purple"
        />
        <StatCard
          label={`Solde caisse (${selectedYear})`}
          value={formatMoney(stats.balance)}
          sub={
            isCurrentYear
              ? `Semaine : +${formatMoney(stats.weekIn - stats.weekOut)}`
              : `Net annuel : ${formatMoney(stats.yearIn - stats.yearOut)}`
          }
          icon={<Banknote className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      <Card title="Mouvements caisse par mois">
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Entrées et sorties — 12 mois de {selectedYear} (montants en dollars)
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyMovements}
              margin={{ top: 28, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${Math.round(Number(v) / 1000)}k` : String(v)
                }
              />
              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
                labelFormatter={(label) => `Mois : ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Entrées"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
              >
                <LabelList
                  dataKey="Entrées"
                  position="top"
                  offset={10}
                  formatter={chartMoneyLabel}
                  className="fill-blue-600 text-[10px] font-medium dark:fill-blue-400"
                />
              </Line>
              <Line
                type="monotone"
                dataKey="Sorties"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4, fill: '#ef4444' }}
                activeDot={{ r: 6 }}
              >
                <LabelList
                  dataKey="Sorties"
                  position="bottom"
                  offset={10}
                  formatter={chartMoneyLabel}
                  className="fill-red-600 text-[10px] font-medium dark:fill-red-400"
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {isCurrentYear && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{stats.present}</p>
                <p className="text-xs text-slate-500">
                  {ATTENDANCE_STATUS_LABELS.present} aujourd&apos;hui
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-slate-500">Absents</p>
          </Card>
          <Card>
            <p className="text-2xl font-bold text-amber-600">{stats.retard}</p>
            <p className="text-xs text-slate-500">En retard</p>
          </Card>
          <Card>
            <p className="text-2xl font-bold text-violet-600">{stats.malade}</p>
            <p className="text-xs text-slate-500">Malades</p>
          </Card>
        </div>
      )}

      <Card title={`Résumé financier — ${selectedYear}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          {isCurrentYear ? (
            <>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Cette semaine</p>
                <p className="mt-1 text-sm">Entrées : {formatMoney(stats.weekIn)}</p>
                <p className="text-sm">Sorties : {formatMoney(stats.weekOut)}</p>
                <p className="mt-2 font-semibold text-emerald-700 dark:text-emerald-400">
                  Net : {formatMoney(stats.weekIn - stats.weekOut)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Ce mois</p>
                <p className="mt-1 text-sm">Entrées : {formatMoney(stats.monthIn)}</p>
                <p className="text-sm">Sorties : {formatMoney(stats.monthOut)}</p>
                <p className="mt-2 font-semibold text-emerald-700 dark:text-emerald-400">
                  Net : {formatMoney(stats.monthIn - stats.monthOut)}
                </p>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase text-slate-500">Total annuel</p>
              <p className="mt-1 text-sm">Entrées : {formatMoney(stats.yearIn)}</p>
              <p className="text-sm">Sorties : {formatMoney(stats.yearOut)}</p>
              <p className="mt-2 font-semibold text-emerald-700 dark:text-emerald-400">
                Net : {formatMoney(stats.yearIn - stats.yearOut)}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

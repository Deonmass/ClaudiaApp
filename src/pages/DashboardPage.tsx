import {
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import {
  Banknote,
  FolderKanban,
  UserCheck,
  Users,
  UserCog,
} from 'lucide-react'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, StatCard } from '../components/ui/Card'
import { useData } from '../contexts/DataContext'
import { cashBalance, formatMoney } from '../lib/utils'
import { ATTENDANCE_STATUS_LABELS } from '../types'

export function DashboardPage() {
  const { data } = useData()
  const today = format(new Date(), 'yyyy-MM-dd')
  const stats = useMemo(() => {
    const activeProjects = data.projects.filter((p) => p.status === 'actif').length
    const doneProjects = data.projects.filter((p) => p.status === 'termine').length
    const activeClients = data.clients.filter((c) => c.active).length
    const activeAgents = data.users.filter(
      (u) => u.status === 'actif' && u.role !== 'admin',
    ).length
    const balance = cashBalance(data.cashMovements)

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())

    let weekIn = 0
    let weekOut = 0
    let monthIn = 0
    let monthOut = 0

    data.cashMovements.forEach((m) => {
      const d = parseISO(m.date)
      const amt = m.amount
      if (isWithinInterval(d, { start: weekStart, end: weekEnd })) {
        if (m.type === 'entree') weekIn += amt
        else weekOut += amt
      }
      if (isWithinInterval(d, { start: monthStart, end: monthEnd })) {
        if (m.type === 'entree') monthIn += amt
        else monthOut += amt
      }
    })

    const todayAttendance = data.attendance.filter((a) => a.date === today)
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
      weekIn,
      weekOut,
      monthIn,
      monthOut,
      present,
      absent,
      retard,
      malade,
    }
  }, [data, today])

  const cashChartData = useMemo(() => {
    const weeks: Record<string, { entrees: number; sorties: number }> = {}
    data.cashMovements.forEach((m) => {
      const w = format(parseISO(m.date), 'yyyy-MM-dd')
      const key = w.slice(0, 7)
      if (!weeks[key]) weeks[key] = { entrees: 0, sorties: 0 }
      if (m.type === 'entree') weeks[key].entrees += m.amount
      else weeks[key].sorties += m.amount
    })
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, v]) => ({
        name: month,
        Entrées: Math.round(v.entrees / 1000),
        Sorties: Math.round(v.sorties / 1000),
      }))
  }, [data.cashMovements])

  const presenceTrend = useMemo(() => {
    const days: Record<string, number> = {}
    data.attendance
      .filter((a) => a.status === 'present')
      .forEach((a) => {
        days[a.date] = (days[a.date] ?? 0) + 1
      })
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, count]) => ({
        name: format(parseISO(date), 'dd/MM'),
        Présents: count,
      }))
  }, [data.attendance])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tableau de bord</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Vue d&apos;ensemble — {format(new Date(), 'dd MMMM yyyy')}
        </p>
      </div>

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
          label="Solde caisse global"
          value={formatMoney(stats.balance)}
          sub={`Semaine : +${formatMoney(stats.weekIn - stats.weekOut)}`}
          icon={<Banknote className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Flux caisse (milliers)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashChartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Entrées" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sorties" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Présences (7 derniers jours)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={presenceTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Présents"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

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

      <Card title="Résumé financier">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Cette semaine</p>
            <p className="mt-1 text-sm">
              Entrées : {formatMoney(stats.weekIn)}
            </p>
            <p className="text-sm">
              Sorties : {formatMoney(stats.weekOut)}
            </p>
            <p className="mt-2 font-semibold text-emerald-700 dark:text-emerald-400">
              Net : {formatMoney(stats.weekIn - stats.weekOut)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Ce mois</p>
            <p className="mt-1 text-sm">
              Entrées : {formatMoney(stats.monthIn)}
            </p>
            <p className="text-sm">
              Sorties : {formatMoney(stats.monthOut)}
            </p>
            <p className="mt-2 font-semibold text-emerald-700 dark:text-emerald-400">
              Net : {formatMoney(stats.monthIn - stats.monthOut)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

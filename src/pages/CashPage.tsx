import { format } from 'date-fns'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { useFilteredData } from '../contexts/YearFilterContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeading } from '../components/ui/PageHeading'
import type { Column } from '../components/ui/DataTable'
import { DataTable } from '../components/ui/DataTable'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import {
  defaultDateRange,
  filterMovementsByPeriod,
  showDateRangeInputs,
  sumByType,
  type CashDateRange,
  type CashPeriodFilter,
  type CashTypeFilter,
} from '../lib/cashFilters'
import { formatDate, formatMoney } from '../lib/utils'
import type { CashMovement, CashType } from '../types'

function CashStatCard({
  label,
  value,
  variant,
  sub,
}: {
  label: string
  value: string
  variant: 'balance' | 'in' | 'out'
  sub?: string
}) {
  const styles = {
    balance: {
      wrap:
        'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50 hover:border-blue-400 hover:shadow-lg dark:hover:border-blue-500 dark:hover:shadow-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
    },
    in: {
      wrap:
        'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50 hover:border-emerald-400 hover:shadow-lg dark:hover:border-emerald-500 dark:hover:shadow-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
    out: {
      wrap:
        'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50 hover:border-red-400 hover:shadow-lg dark:hover:border-red-500 dark:hover:shadow-red-950/40',
      text: 'text-red-700 dark:text-red-300',
    },
  }
  const s = styles[variant]
  return (
    <div
      className={clsx(
        'rounded-xl border p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5',
        s.wrap,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={clsx('mt-1 text-xl font-bold sm:text-2xl', s.text)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export function CashPage() {
  const { addCashMovement, deleteCashMovement } = useData()
  const data = useFilteredData()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const projectFilter = searchParams.get('project') ?? ''
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<CashPeriodFilter>('all')
  const [dateRange, setDateRange] = useState<CashDateRange>(() =>
    defaultDateRange('quarter'),
  )
  const [typeFilter, setTypeFilter] = useState<CashTypeFilter>('all')

  const handlePeriodChange = (p: CashPeriodFilter) => {
    setPeriod(p)
    if (p === 'quarter' || p === 'interval') {
      setDateRange(defaultDateRange(p))
    }
  }

  const activeProjects = data.projects.filter((p) => p.status !== 'termine')

  const baseMovements = useMemo(() => {
    let list = [...data.cashMovements]
    if (projectFilter) list = list.filter((m) => m.projectId === projectFilter)
    list = filterMovementsByPeriod(
      list,
      period,
      showDateRangeInputs(period) ? dateRange : undefined,
    )
    if (typeFilter !== 'all') list = list.filter((m) => m.type === typeFilter)
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [data.cashMovements, projectFilter, period, dateRange, typeFilter])

  const movements = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return baseMovements
    return baseMovements.filter((m) => {
      const project = data.projects.find((p) => p.id === m.projectId)
      const agent = data.users.find((u) => u.id === m.agentId)
      return (
        m.description.toLowerCase().includes(q) ||
        (m.source?.toLowerCase().includes(q) ?? false) ||
        (m.beneficiary?.toLowerCase().includes(q) ?? false) ||
        project?.name.toLowerCase().includes(q) ||
        project?.code.toLowerCase().includes(q) ||
        agent?.fullName.toLowerCase().includes(q)
      )
    })
  }, [baseMovements, search, data.projects, data.users])

  const totals = useMemo(() => {
    const entrees = sumByType(baseMovements, 'entree')
    const sorties = sumByType(baseMovements, 'sortie')
    return { entrees, sorties, solde: entrees - sorties }
  }, [baseMovements])

  const columns: Column<CashMovement>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (m) => m.date,
      render: (m) => formatDate(m.date),
    },
    {
      key: 'type',
      header: 'Type',
      render: (m) => (
        <Badge variant={m.type === 'entree' ? 'success' : 'danger'}>
          {m.type === 'entree' ? 'Entrée' : 'Sortie'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Montant',
      sortable: true,
      sortValue: (m) => m.amount,
      render: (m) => (
        <span
          className={
            m.type === 'entree'
              ? 'font-medium text-emerald-600 dark:text-emerald-400'
              : 'font-medium text-red-600 dark:text-red-400'
          }
        >
          {formatMoney(m.amount)}
        </span>
      ),
    },
    {
      key: 'project',
      header: 'Projet',
      render: (m) => {
        const p = data.projects.find((pr) => pr.id === m.projectId)
        return p ? (
          <span>
            <code className="text-xs text-slate-500">{p.code}</code>
            <br />
            {p.name}
          </span>
        ) : (
          '—'
        )
      },
    },
    { key: 'desc', header: 'Motif', render: (m) => m.description },
    {
      key: 'extra',
      header: 'Source / Bénéf.',
      render: (m) =>
        m.type === 'entree' ? (m.source ?? '—') : (m.beneficiary ?? '—'),
    },
    {
      key: 'agent',
      header: 'Saisi par',
      render: (m) => data.users.find((u) => u.id === m.agentId)?.fullName ?? '—',
    },
  ]

  const periodOptions: { id: CashPeriodFilter; label: string }[] = [
    { id: 'all', label: 'Toutes dates' },
    { id: 'week', label: 'Semaine' },
    { id: 'month', label: 'Mensuel' },
    { id: 'quarter', label: 'Trimestre' },
    { id: 'interval', label: 'Intervalle' },
  ]

  const typeOptions: { id: CashTypeFilter; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'entree', label: 'Entrées' },
    { id: 'sortie', label: 'Sorties' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <PageHeading
            title="Caisse"
            description="Mouvements financiers par projet"
          />
        </div>
        <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 xl:justify-end xl:ml-auto">
          <div className="relative h-10 w-[min(220px,32vw)] shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              aria-label="Rechercher"
              className="h-full w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <label htmlFor="cash-project-filter" className="sr-only">
            Projet
          </label>
          <select
            id="cash-project-filter"
            value={projectFilter}
            onChange={(e) => {
              const v = e.target.value
              const next = new URLSearchParams(searchParams)
              if (v) next.set('project', v)
              else next.delete('project')
              setSearchParams(next)
            }}
            className="h-10 w-[min(200px,28vw)] shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Tous les projets</option>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <Button
            onClick={() => setModalOpen(true)}
            className="h-10 shrink-0 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Nouvelle opération
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CashStatCard
          label="Solde"
          value={formatMoney(totals.solde)}
          variant="balance"
          sub={
            projectFilter
              ? data.projects.find((p) => p.id === projectFilter)?.name
              : 'Tous les projets (filtres appliqués)'
          }
        />
        <CashStatCard
          label="Entrées"
          value={formatMoney(totals.entrees)}
          variant="in"
        />
        <CashStatCard
          label="Sorties"
          value={formatMoney(totals.sorties)}
          variant="out"
        />
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Statut :</span>
            {typeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTypeFilter(opt.id)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  typeFilter === opt.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-700/50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                )}
              >
                {opt.label}
              </button>
            ))}
            <span className="ml-2 hidden h-4 w-px bg-slate-300 sm:inline dark:bg-slate-600" />
            <span className="w-full text-xs font-medium text-slate-500 sm:w-auto">
              Période :
            </span>
            {periodOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handlePeriodChange(opt.id)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  period === opt.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-700/50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {showDateRangeInputs(period) && (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <span className="w-full text-xs font-medium text-slate-500 sm:w-auto">
                Intervalle :
              </span>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Date de départ</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange((r) => ({ ...r, from: e.target.value }))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Date de fin</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
              </div>
              {period === 'quarter' && (
                <p className="text-xs text-slate-400">
                  Trimestre en cours (début → aujourd&apos;hui)
                </p>
              )}
            </div>
          )}
        </div>

        <DataTable
          data={movements}
          columns={columns}
          emptyMessage="Aucun mouvement pour ces filtres"
          actions={(row) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Supprimer ce mouvement ?')) deleteCashMovement(row.id)
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        />
      </Card>

      <CashFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projects={activeProjects}
        defaultProjectId={projectFilter || activeProjects[0]?.id}
        agentId={user?.id ?? ''}
        onSave={(form) => {
          addCashMovement(form)
          setModalOpen(false)
        }}
      />
    </div>
  )
}

function CashFormModal({
  open,
  onClose,
  projects,
  defaultProjectId,
  agentId,
  onSave,
}: {
  open: boolean
  onClose: () => void
  projects: { id: string; name: string; code: string }[]
  defaultProjectId: string
  agentId: string
  onSave: (form: Omit<CashMovement, 'id'>) => void
}) {
  const [projectId, setProjectId] = useState(defaultProjectId)
  const [type, setType] = useState<CashType>('entree')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('')
  const [beneficiary, setBeneficiary] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setProjectId(defaultProjectId)
    setType('entree')
    setAmount('')
    setDescription('')
    setSource('')
    setBeneficiary('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setErrors({})
  }, [open, defaultProjectId])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    const amt = parseFloat(amount)
    if (!projectId) err.projectId = 'Projet requis'
    if (!amount || isNaN(amt) || amt <= 0) err.amount = 'Montant invalide'
    if (!description.trim()) err.description = 'Description requise'
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }
    onSave({
      projectId,
      type,
      amount: amt,
      description: description.trim(),
      date,
      agentId,
      ...(type === 'entree'
        ? { source: source.trim() || 'Non précisé' }
        : { beneficiary: beneficiary.trim() || 'Non précisé' }),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle opération" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Projet"
          required
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          error={errors.projectId}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </Select>
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value as CashType)}>
          <option value="entree">Entrée</option>
          <option value="sortie">Sortie</option>
        </Select>
        <Input
          label="Montant (USD)"
          type="number"
          min="0"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
        />
        <Textarea
          label="Motif"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
        />
        {type === 'entree' ? (
          <Input label="Source" value={source} onChange={(e) => setSource(e.target.value)} />
        ) : (
          <Input
            label="Bénéficiaire"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
          />
        )}
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}

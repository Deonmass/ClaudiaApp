import { format } from 'date-fns'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { useFilteredData } from '../contexts/YearFilterContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ContextMenu, type ContextMenuItem } from '../components/ui/ContextMenu'
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
import {
  allowedCashTypesForUser,
  canOperateCash,
  canViewCashHistory,
} from '../lib/permissions'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../lib/swal'
import { formatSupabaseError } from '../lib/supabase-errors'
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

/** Page caisse : saisie seule (sans historique) pour les opérateurs sans droit « Voir » */
function CashOperationOnlyPage() {
  const { addCashMovement } = useData()
  const data = useFilteredData()
  const { user } = useAuth()
  const activeProjects = data.projects.filter((p) => p.status !== 'termine')
  const allowedTypes = allowedCashTypesForUser(user)

  const handleSave = async (form: Omit<CashMovement, 'id'>) => {
    try {
      await addCashMovement(form)
      await showSuccessAlert(
        'Opération enregistrée',
        form.type === 'entree'
          ? `Entrée de ${formatMoney(form.amount)} enregistrée avec succès.`
          : `Sortie de ${formatMoney(form.amount)} enregistrée avec succès.`,
      )
    } catch (e) {
      await showErrorAlert('Erreur', formatSupabaseError(e))
      throw e
    }
  }

  if (!canOperateCash(user) || allowedTypes.length === 0) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        Vous n&apos;avez pas la permission d&apos;effectuer une opération de caisse.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeading
        title="Caisse"
        description="Saisie d'une opération — l'historique n'est pas accessible avec votre profil"
      />
      <Card>
        <CashOperationForm
          projects={activeProjects}
          defaultProjectId={activeProjects[0]?.id ?? ''}
          agentId={user?.id ?? ''}
          allowedTypes={allowedTypes}
          onSave={handleSave}
          resetAfterSave
        />
      </Card>
    </div>
  )
}

export function CashPage() {
  const { user, canPerform, isAdmin } = useAuth()

  const showHistory =
    isAdmin || canViewCashHistory(user) || canPerform('cash', 'view')

  if (!showHistory) {
    return <CashOperationOnlyPage />
  }

  return <CashHistoryPage />
}

function CashHistoryPage() {
  const { addCashMovement, updateCashMovement, deleteCashMovement } = useData()
  const data = useFilteredData()
  const { user, canPerform, isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const projectFilter = searchParams.get('project') ?? ''
  const [modalOpen, setModalOpen] = useState(false)
  const [viewMovement, setViewMovement] = useState<CashMovement | null>(null)
  const [editMovement, setEditMovement] = useState<CashMovement | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    movement: CashMovement
  } | null>(null)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<CashPeriodFilter>('all')
  const [dateRange, setDateRange] = useState<CashDateRange>(() =>
    defaultDateRange('quarter'),
  )
  const [typeFilter, setTypeFilter] = useState<CashTypeFilter>('all')

  const canView = isAdmin || canPerform('cash', 'view')
  const canEdit = isAdmin || canPerform('cash', 'edit')
  const canDelete = isAdmin || canPerform('cash', 'delete')
  const canCreate =
    isAdmin ||
    canPerform('cash', 'create') ||
    canPerform('cash', 'cash_entree') ||
    canPerform('cash', 'cash_sortie')
  const allowedTypes = allowedCashTypesForUser(user)
  const hasRowActions = canView || canEdit || canDelete

  const handlePeriodChange = (p: CashPeriodFilter) => {
    setPeriod(p)
    if (p === 'quarter' || p === 'interval') {
      setDateRange(defaultDateRange(p))
    }
  }

  const activeProjects = data.projects.filter((p) => p.status !== 'termine')

  const projectsForForm = useMemo(() => {
    const base = [...activeProjects]
    const extraId = editMovement?.projectId
    if (extraId && !base.some((p) => p.id === extraId)) {
      const extra = data.projects.find((p) => p.id === extraId)
      if (extra) base.push(extra)
    }
    return base
  }, [activeProjects, editMovement?.projectId, data.projects])

  const handleDelete = async (movement: CashMovement) => {
    const result = await showConfirmAlert(
      'Supprimer cette opération ?',
      `${movement.description} — ${formatMoney(movement.amount)}. Action irréversible.`,
      'Supprimer',
    )
    if (!result.isConfirmed) return
    try {
      await deleteCashMovement(movement.id)
      await showSuccessAlert('Opération supprimée')
    } catch (e) {
      await showErrorAlert('Erreur', formatSupabaseError(e))
    }
  }

  const movementMenuItems = (m: CashMovement): ContextMenuItem[] => {
    const items: ContextMenuItem[] = []
    if (canView) {
      items.push({
        id: 'view',
        label: 'Voir',
        icon: <Eye className="h-4 w-4" />,
        onClick: () => setViewMovement(m),
      })
    }
    if (canEdit) {
      items.push({
        id: 'edit',
        label: 'Modifier',
        icon: <Pencil className="h-4 w-4" />,
        onClick: () => setEditMovement(m),
      })
    }
    if (canDelete) {
      items.push({
        id: 'delete',
        label: 'Supprimer',
        icon: <Trash2 className="h-4 w-4" />,
        danger: true,
        onClick: () => void handleDelete(m),
      })
    }
    return items
  }

  const openContextMenu = (e: React.MouseEvent, movement: CashMovement) => {
    e.preventDefault()
    if (!hasRowActions) return
    setContextMenu({ x: e.clientX, y: e.clientY, movement })
  }

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
          {canCreate && allowedTypes.length > 0 ? (
            <Button
              onClick={() => setModalOpen(true)}
              className="h-10 shrink-0 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Nouvelle opération
            </Button>
          ) : null}
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
          onRowContextMenu={hasRowActions ? openContextMenu : undefined}
          actions={
            hasRowActions
              ? (row) => (
                  <>
                    {canView ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Voir"
                        onClick={() => setViewMovement(row)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : null}
                    {canEdit ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Modifier"
                        onClick={() => setEditMovement(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Supprimer"
                        onClick={() => void handleDelete(row)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    ) : null}
                  </>
                )
              : undefined
          }
        />
      </Card>

      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={movementMenuItems(contextMenu.movement)}
          onClose={() => setContextMenu(null)}
        />
      ) : null}

      {viewMovement ? (
        <CashMovementViewModal
          movement={viewMovement}
          projects={data.projects}
          users={data.users}
          onClose={() => setViewMovement(null)}
          onEdit={
            canEdit
              ? () => {
                  setEditMovement(viewMovement)
                  setViewMovement(null)
                }
              : undefined
          }
        />
      ) : null}

      {canCreate && allowedTypes.length > 0 ? (
        <CashFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          projects={activeProjects}
          defaultProjectId={projectFilter || activeProjects[0]?.id}
          agentId={user?.id ?? ''}
          allowedTypes={allowedTypes}
          onSave={async (form) => {
            await addCashMovement(form)
            setModalOpen(false)
          }}
        />
      ) : null}

      {editMovement && canEdit ? (
        <CashFormModal
          open
          movement={editMovement}
          onClose={() => setEditMovement(null)}
          projects={projectsForForm}
          defaultProjectId={editMovement.projectId}
          agentId={editMovement.agentId}
          allowedTypes={allowedTypes}
          onSave={async (form) => {
            await updateCashMovement(editMovement.id, form)
            setEditMovement(null)
            await showSuccessAlert('Opération mise à jour')
          }}
        />
      ) : null}
    </div>
  )
}

function CashMovementViewModal({
  movement,
  projects,
  users,
  onClose,
  onEdit,
}: {
  movement: CashMovement
  projects: { id: string; name: string; code: string }[]
  users: { id: string; fullName: string }[]
  onClose: () => void
  onEdit?: () => void
}) {
  const project = projects.find((p) => p.id === movement.projectId)
  const agent = users.find((u) => u.id === movement.agentId)

  const rows: [string, string][] = [
    ['Date', formatDate(movement.date)],
    ['Type', movement.type === 'entree' ? 'Entrée' : 'Sortie'],
    ['Montant', formatMoney(movement.amount)],
    ['Projet', project ? `${project.code} — ${project.name}` : '—'],
    ['Motif', movement.description],
    [
      movement.type === 'entree' ? 'Source' : 'Bénéficiaire',
      movement.type === 'entree'
        ? (movement.source ?? '—')
        : (movement.beneficiary ?? '—'),
    ],
    ['Saisi par', agent?.fullName ?? '—'],
  ]

  return (
    <Modal open onClose={onClose} title="Détail de l'opération" size="lg">
      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-0.5 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800 sm:flex-row sm:gap-4"
          >
            <dt className="w-32 shrink-0 text-sm font-medium text-slate-500">{label}</dt>
            <dd className="text-sm text-slate-900 dark:text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex justify-end gap-2">
        {onEdit ? (
          <Button variant="secondary" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
        ) : null}
        <Button onClick={onClose}>Fermer</Button>
      </div>
    </Modal>
  )
}

function CashOperationForm({
  projects,
  defaultProjectId,
  agentId,
  allowedTypes,
  movement,
  onSave,
  onCancel,
  resetAfterSave = false,
}: {
  projects: { id: string; name: string; code: string }[]
  defaultProjectId: string
  agentId: string
  allowedTypes: CashType[]
  movement?: CashMovement
  onSave: (form: Omit<CashMovement, 'id'>) => Promise<void>
  onCancel?: () => void
  resetAfterSave?: boolean
}) {
  const isEdit = Boolean(movement)
  const initialType = movement?.type ?? allowedTypes[0] ?? 'entree'
  const [projectId, setProjectId] = useState(movement?.projectId ?? defaultProjectId)
  const [type, setType] = useState<CashType>(initialType)
  const [amount, setAmount] = useState(movement ? String(movement.amount) : '')
  const [description, setDescription] = useState(movement?.description ?? '')
  const [source, setSource] = useState(movement?.source ?? '')
  const [beneficiary, setBeneficiary] = useState(movement?.beneficiary ?? '')
  const [date, setDate] = useState(movement?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    if (movement) {
      setProjectId(movement.projectId)
      setType(movement.type)
      setAmount(String(movement.amount))
      setDescription(movement.description)
      setSource(movement.source ?? '')
      setBeneficiary(movement.beneficiary ?? '')
      setDate(movement.date)
    } else {
      setProjectId(defaultProjectId)
      setType(allowedTypes[0] ?? 'entree')
      setAmount('')
      setDescription('')
      setSource('')
      setBeneficiary('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
    }
    setErrors({})
  }

  useEffect(() => {
    resetForm()
  }, [defaultProjectId, allowedTypes.join(','), movement?.id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    const amt = parseFloat(amount)
    if (!projectId) err.projectId = 'Projet requis'
    if (!amount || isNaN(amt) || amt <= 0) err.amount = 'Montant invalide'
    if (!description.trim()) err.description = 'Description requise'
    if (!allowedTypes.includes(type)) {
      err.type = "Vous n'avez pas la permission pour ce type d'opération"
    }
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }
    setSaving(true)
    try {
      await onSave({
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
      if (resetAfterSave) resetForm()
    } catch {
      /* alerte gérée par l'appelant */
    } finally {
      setSaving(false)
    }
  }

  const typeLocked = isEdit || allowedTypes.length === 1

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
      {typeLocked ? (
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Type
          </span>
          <Badge variant={type === 'entree' ? 'success' : 'danger'}>
            {type === 'entree' ? 'Entrée' : 'Sortie'}
          </Badge>
        </div>
      ) : (
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as CashType)}
          error={errors.type}
        >
          {allowedTypes.includes('entree') ? (
            <option value="entree">Entrée</option>
          ) : null}
          {allowedTypes.includes('sortie') ? (
            <option value="sortie">Sortie</option>
          ) : null}
        </Select>
      )}
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
        {onCancel ? (
          <Button variant="secondary" type="button" onClick={onCancel} disabled={saving}>
            Annuler
          </Button>
        ) : null}
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}

function CashFormModal({
  open,
  onClose,
  projects,
  defaultProjectId,
  agentId,
  allowedTypes,
  movement,
  onSave,
}: {
  open: boolean
  onClose: () => void
  projects: { id: string; name: string; code: string }[]
  defaultProjectId: string
  agentId: string
  allowedTypes: CashType[]
  movement?: CashMovement
  onSave: (form: Omit<CashMovement, 'id'>) => Promise<void>
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={movement ? "Modifier l'opération" : 'Nouvelle opération'}
      size="lg"
    >
      <CashOperationForm
        projects={projects}
        defaultProjectId={defaultProjectId}
        agentId={agentId}
        allowedTypes={allowedTypes}
        movement={movement}
        onCancel={onClose}
        onSave={async (form) => {
          await onSave(form)
          onClose()
        }}
      />
    </Modal>
  )
}

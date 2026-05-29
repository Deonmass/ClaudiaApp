import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Archive, FileDown, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useData } from '../../contexts/DataContext'
import { exportProjectPdf } from '../../lib/exportProjectPdf'
import {
  formatDate,
  formatMoney,
  formatProjectDuration,
  projectCashTotals,
} from '../../lib/utils'
import type { CashMovement, CashType, Project } from '../../types'
import { PROJECT_STATUS_LABELS, ROLE_LABELS } from '../../types'
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'

interface ProjectDetailModalProps {
  project: Project | null
  onClose: () => void
  onProjectChange?: (p: Project) => void
}

type MovementFormState =
  | { mode: 'add'; type: CashType }
  | { mode: 'edit'; movement: CashMovement }
  | null

export function ProjectDetailModal({
  project: projectProp,
  onClose,
  onProjectChange,
}: ProjectDetailModalProps) {
  const { data, addCashMovement, updateCashMovement, deleteCashMovement, archiveProject } =
    useData()
  const { user } = useAuth()
  const [movementForm, setMovementForm] = useState<MovementFormState>(null)
  const [movementMenu, setMovementMenu] = useState<{
    x: number
    y: number
    movement: CashMovement
  } | null>(null)

  const project = useMemo(() => {
    if (!projectProp) return null
    return data.projects.find((p) => p.id === projectProp.id) ?? projectProp
  }, [projectProp, data.projects])

  const finance = useMemo(() => {
    if (!project) return { entrees: 0, sorties: 0, marge: 0 }
    return projectCashTotals(data.cashMovements, project.id)
  }, [project, data.cashMovements])

  const movements = useMemo(() => {
    if (!project) return { entrees: [] as CashMovement[], sorties: [] as CashMovement[] }
    const all = data.cashMovements
      .filter((m) => m.projectId === project.id)
      .sort((a, b) => b.date.localeCompare(a.date))
    return {
      entrees: all.filter((m) => m.type === 'entree'),
      sorties: all.filter((m) => m.type === 'sortie'),
    }
  }, [project, data.cashMovements])

  useEffect(() => {
    if (project && onProjectChange) onProjectChange(project)
  }, [project, onProjectChange])

  if (!project) return null

  const manager = data.users.find((u) => u.id === project.managerId)
  const clientLabel =
    project.clientName ??
    (project.clientId
      ? data.clients.find((c) => c.id === project.clientId)?.name
      : undefined) ??
    '—'

  const infoRows: [string, string][] = [
    ['Code', project.code],
    ['Nom', project.name],
    ['Client', clientLabel],
    ['Statut', PROJECT_STATUS_LABELS[project.status]],
    ['Responsable', manager?.fullName ?? '—'],
    ['Rôle resp.', manager ? ROLE_LABELS[manager.role] : '—'],
    ['Description', project.description ?? '—'],
    ['Début', formatDate(project.startDate)],
    ['Fin prévue', project.endDate ? formatDate(project.endDate) : '—'],
    ['Création', format(parseISO(project.createdAt), 'dd/MM/yyyy', { locale: fr })],
    [
      'Durée',
      formatProjectDuration(project.createdAt, project.endDate, project.status),
    ],
  ]

  const closeMovementForm = () => setMovementForm(null)

  const handleFormSubmit = (payload: Omit<CashMovement, 'id'>) => {
    if (movementForm?.mode === 'edit') {
      updateCashMovement(movementForm.movement.id, payload)
    } else {
      addCashMovement(payload)
    }
    closeMovementForm()
  }

  const handleExportPdf = () => {
    const projectMovements = data.cashMovements.filter((m) => m.projectId === project.id)
    exportProjectPdf(project, projectMovements, manager)
  }

  const handleArchive = () => {
    if (!confirm('Clôturer ce projet ?')) return
    archiveProject(project.id)
  }

  const movementMenuItems = (m: CashMovement): ContextMenuItem[] => [
    {
      id: 'edit',
      label: 'Modifier',
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => setMovementForm({ mode: 'edit', movement: m }),
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      onClick: () => {
        if (confirm('Supprimer ce mouvement ?')) deleteCashMovement(m.id)
      },
    },
  ]

  const formType =
    movementForm?.mode === 'edit'
      ? movementForm.movement.type
      : movementForm?.mode === 'add'
        ? movementForm.type
        : null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-1 sm:items-center sm:p-3">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative flex h-[94vh] w-full max-w-[min(96vw,1440px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-modal
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {project.name}
            </h2>
            <code className="text-xs text-primary-600 dark:text-primary-400">
              {project.code}
            </code>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportPdf}
              aria-label="Exporter en PDF"
              title="Exporter en PDF"
            >
              <FileDown className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fermer">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex w-full shrink-0 flex-col border-b border-slate-100 dark:border-slate-800 lg:w-[28%] lg:max-w-sm lg:border-b-0 lg:border-r">
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Informations du projet
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {infoRows.map(([label, value]) => (
                    <tr
                      key={label}
                      className="border-b border-slate-50 last:border-0 dark:border-slate-800"
                    >
                      <td className="py-2 pr-3 align-top font-medium text-slate-500">
                        {label}
                      </td>
                      <td className="py-2 text-slate-800 dark:text-slate-200">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {project.status !== 'termine' && (
              <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                <Button variant="danger" className="w-full" onClick={handleArchive}>
                  <Archive className="h-4 w-4" />
                  Clôturer le projet
                </Button>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FinanceCard label="Total entrées" value={formatMoney(finance.entrees)} variant="in" />
              <FinanceCard label="Total sorties" value={formatMoney(finance.sorties)} variant="out" />
              <BalanceCard amount={finance.marge} />
              <FinanceCard
                label="Marge"
                value={formatMoney(finance.marge)}
                variant="margin"
                sub={
                  finance.entrees > 0
                    ? `${Math.round((finance.marge / finance.entrees) * 100)} %`
                    : '—'
                }
              />
            </div>

            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
              <MovementSection
                title="Entrées"
                count={movements.entrees.length}
                type="entree"
                items={movements.entrees}
                onAdd={() => setMovementForm({ mode: 'add', type: 'entree' })}
                onContextMenu={(e, m) => {
                  e.preventDefault()
                  setMovementMenu({ x: e.clientX, y: e.clientY, movement: m })
                }}
              />
              <MovementSection
                title="Sorties"
                count={movements.sorties.length}
                type="sortie"
                items={movements.sorties}
                onAdd={() => setMovementForm({ mode: 'add', type: 'sortie' })}
                onContextMenu={(e, m) => {
                  e.preventDefault()
                  setMovementMenu({ x: e.clientX, y: e.clientY, movement: m })
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {movementMenu && (
        <ContextMenu
          x={movementMenu.x}
          y={movementMenu.y}
          items={movementMenuItems(movementMenu.movement)}
          onClose={() => setMovementMenu(null)}
        />
      )}

      {movementForm && formType && (
        <Modal
          elevated
          open
          onClose={closeMovementForm}
          title={
            movementForm.mode === 'edit'
              ? `Modifier ${formType === 'entree' ? "l'entrée" : 'la sortie'}`
              : formType === 'entree'
                ? 'Nouvelle entrée'
                : 'Nouvelle sortie'
          }
          size="md"
        >
          <MovementForm
            type={formType}
            projectId={project.id}
            agentId={user?.id ?? ''}
            initial={
              movementForm.mode === 'edit' ? movementForm.movement : undefined
            }
            onSubmit={handleFormSubmit}
            onCancel={closeMovementForm}
          />
        </Modal>
      )}
    </div>
  )
}

function BalanceCard({ amount }: { amount: number }) {
  const positif = amount >= 0
  const colors = positif
    ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:shadow-md dark:border-emerald-900 dark:bg-emerald-950/40 dark:hover:border-emerald-700'
    : 'border-red-200 bg-red-50 hover:border-red-300 hover:shadow-md dark:border-red-900 dark:bg-red-950/40 dark:hover:border-red-700'
  const text = positif
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-red-700 dark:text-red-400'
  const badge = positif
    ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    : 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'

  return (
    <div className={`rounded-xl border p-3 transition-all duration-200 ${colors}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Solde
        </p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badge}`}>
          {positif ? 'Positif' : 'Négatif'}
        </span>
      </div>
      <p className={`mt-1 text-sm font-bold sm:text-base ${text}`}>
        {formatMoney(amount)}
      </p>
    </div>
  )
}

function FinanceCard({
  label,
  value,
  variant,
  sub,
}: {
  label: string
  value: string
  variant: 'in' | 'out' | 'margin'
  sub?: string
}) {
  const colors = {
    in: 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:shadow-md dark:border-emerald-900 dark:bg-emerald-950/40 dark:hover:border-emerald-700',
    out: 'border-red-200 bg-red-50 hover:border-red-300 hover:shadow-md dark:border-red-900 dark:bg-red-950/40 dark:hover:border-red-700',
    margin:
      'border-amber-200 bg-amber-50 hover:border-amber-300 hover:shadow-md dark:border-amber-900 dark:bg-amber-950/40 dark:hover:border-amber-700',
  }
  const text = {
    in: 'text-emerald-700 dark:text-emerald-400',
    out: 'text-red-700 dark:text-red-400',
    margin: 'text-amber-700 dark:text-amber-400',
  }
  return (
    <div className={`rounded-xl border p-3 transition-all duration-200 ${colors[variant]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-sm font-bold sm:text-base ${text[variant]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

function MovementSection({
  title,
  count,
  type,
  items,
  onAdd,
  onContextMenu,
}: {
  title: string
  count: number
  type: CashType
  items: CashMovement[]
  onAdd: () => void
  onContextMenu: (e: React.MouseEvent, m: CashMovement) => void
}) {
  const isEntree = type === 'entree'
  const headerClass = isEntree
    ? 'border-emerald-100 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
    : 'border-red-100 bg-red-50/80 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-slate-200 dark:border-slate-700">
      <div
        className={`flex items-center justify-between gap-2 border-b px-3 py-2.5 ${headerClass}`}
      >
        <span className="text-sm font-semibold">{title}</span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold tabular-nums dark:bg-slate-900/50">
            {count}
          </span>
          <button
            type="button"
            onClick={onAdd}
            title={isEntree ? 'Ajouter une entrée' : 'Ajouter une sortie'}
            aria-label={isEntree ? 'Ajouter une entrée' : 'Ajouter une sortie'}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:scale-105 ${
              isEntree
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-2 py-2 text-left font-semibold text-slate-500">Date</th>
              <th className="px-2 py-2 text-right font-semibold text-slate-500">Montant</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-500">Motif</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-500">
                {isEntree ? 'Source' : 'Bénéficiaire'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-8 text-center text-slate-400">
                  Aucun mouvement
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr
                  key={m.id}
                  onContextMenu={(e) => onContextMenu(e, m)}
                  className="cursor-context-menu transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  title="Clic droit : modifier ou supprimer"
                >
                  <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                    {formatDate(m.date)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-2 py-2 text-right font-medium ${
                      isEntree
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatMoney(m.amount)}
                  </td>
                  <td className="max-w-[120px] truncate px-2 py-2" title={m.description}>
                    {m.description}
                  </td>
                  <td className="max-w-[100px] truncate px-2 py-2 text-slate-500">
                    {isEntree ? m.source ?? '—' : m.beneficiary ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MovementForm({
  type,
  projectId,
  agentId,
  initial,
  onSubmit,
  onCancel,
}: {
  type: CashType
  projectId: string
  agentId: string
  initial?: CashMovement
  onSubmit: (m: Omit<CashMovement, 'id'>) => void
  onCancel: () => void
}) {
  const isEntree = type === 'entree'
  const [date, setDate] = useState(initial?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [motif, setMotif] = useState(initial?.description ?? '')
  const [extra, setExtra] = useState(
    initial
      ? isEntree
        ? (initial.source ?? '')
        : (initial.beneficiary ?? '')
      : '',
  )

  useEffect(() => {
    if (initial) {
      setDate(initial.date)
      setAmount(String(initial.amount))
      setMotif(initial.description)
      setExtra(isEntree ? (initial.source ?? '') : (initial.beneficiary ?? ''))
    } else {
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setAmount('')
      setMotif('')
      setExtra('')
    }
  }, [initial, isEntree])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0 || !motif.trim()) return
    onSubmit({
      projectId,
      type,
      amount: amt,
      description: motif.trim(),
      date,
      agentId: initial?.agentId ?? agentId,
      ...(isEntree
        ? { source: extra.trim() || 'Non précisé' }
        : { beneficiary: extra.trim() || 'Non précisé' }),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input
          label="Montant ($)"
          type="number"
          min="0"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <Input label="Motif" required value={motif} onChange={(e) => setMotif(e.target.value)} />
      <Input
        label={isEntree ? 'Source' : 'Bénéficiaire'}
        value={extra}
        onChange={(e) => setExtra(e.target.value)}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant={isEntree ? 'primary' : 'danger'}>
          {initial ? 'Mettre à jour' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}

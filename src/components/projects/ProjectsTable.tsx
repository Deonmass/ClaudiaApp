import clsx from 'clsx'
import {
  Archive,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Pencil,
  Search,
} from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Badge } from '../ui/Badge'
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu'
import { Button } from '../ui/Button'
import type { Project, ProjectStatus } from '../../types'
import { PROJECT_STATUS_LABELS } from '../../types'

export interface ProjectRow extends Project {
  entrees: number
  sorties: number
  marge: number
}

interface ProjectsTableProps {
  data: ProjectRow[]
  formatMoney: (n: number) => string
  formatDate: (d: string) => string
  formatDuration: (p: Project) => string
  managerName: (id: string) => string
  statusVariant: Record<ProjectStatus, 'success' | 'default' | 'warning'>
  onOpen: (p: Project) => void
  onEdit: (p: Project) => void
  onArchive: (p: Project) => void
  search: string
}

type SortKey =
  | 'name'
  | 'code'
  | 'entrees'
  | 'sorties'
  | 'marge'
  | 'createdAt'

export function ProjectsTable({
  data,
  formatMoney,
  formatDate,
  formatDuration,
  managerName,
  statusVariant,
  onOpen,
  onEdit,
  onArchive,
  search,
}: ProjectsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const [menu, setMenu] = useState<{
    x: number
    y: number
    project: Project
  } | null>(null)
  const pageSize = 10

  const filtered = useMemo(() => {
    let rows = data
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.clientName ?? '').toLowerCase().includes(q),
      )
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const va = a[sortKey] as string | number
        const vb = b[sortKey] as string | number
        const cmp = va < vb ? -1 : va > vb ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return rows
  }, [data, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  const openMenu = useCallback((e: React.MouseEvent, project: Project) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, project })
  }, [])

  const menuItems = (p: Project): ContextMenuItem[] => [
    {
      id: 'open',
      label: 'Ouvrir le projet',
      icon: <FolderOpen className="h-4 w-4" />,
      onClick: () => onOpen(p),
    },
    {
      id: 'edit',
      label: 'Modifier',
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => onEdit(p),
    },
    {
      id: 'archive',
      label: 'Clôturer / archiver',
      icon: <Archive className="h-4 w-4" />,
      onClick: () => onArchive(p),
      danger: true,
      disabled: p.status === 'termine',
    },
  ]

  const SortHead = ({ label, col }: { label: string; col: SortKey }) => (
    <th
      className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      onClick={() => toggleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === col &&
          (sortDir === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          ))}
      </span>
    </th>
  )

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80">
            <tr>
              <SortHead label="Création" col="createdAt" />
              <SortHead label="Code" col="code" />
              <SortHead label="Nom" col="name" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Statut
              </th>
              <SortHead label="Entrées" col="entrees" />
              <SortHead label="Sorties" col="sorties" />
              <SortHead label="Marge" col="marge" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Durée
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Responsable
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                  Aucun projet
                </td>
              </tr>
            ) : (
              paged.map((p) => (
                <tr
                  key={p.id}
                  onContextMenu={(e) => openMenu(e, p)}
                  className="cursor-context-menu transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-950/30"
                  title="Clic droit pour les actions — clic sur le code pour ouvrir"
                >
                  <Td>{formatDate(p.createdAt)}</Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => onOpen(p)}
                      className="rounded bg-primary-50 px-1.5 py-0.5 font-mono text-xs text-primary-700 transition hover:bg-primary-100 hover:underline dark:bg-primary-950/50 dark:text-primary-300 dark:hover:bg-primary-900/60"
                    >
                      {p.code}
                    </button>
                  </Td>
                  <Td>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {p.name}
                    </span>
                  </Td>
                  <Td className="font-medium text-slate-800 dark:text-slate-200">
                    {p.clientName ?? '—'}
                  </Td>
                  <Td>
                    <Badge variant={statusVariant[p.status]}>
                      {PROJECT_STATUS_LABELS[p.status]}
                    </Badge>
                  </Td>
                  <Td className="text-emerald-600 dark:text-emerald-400">
                    {formatMoney(p.entrees)}
                  </Td>
                  <Td className="text-red-600 dark:text-red-400">
                    {formatMoney(p.sorties)}
                  </Td>
                  <Td
                    className={clsx(
                      'font-medium',
                      p.marge >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600',
                    )}
                  >
                    {formatMoney(p.marge)}
                  </Td>
                  <Td className="text-slate-500">{formatDuration(p)}</Td>
                  <Td>{managerName(p.managerId)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} sur{' '}
            {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((n) => n - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((n) => n + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems(menu.project)}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  )
}

export function ProjectsToolbar({
  statusFilter,
  onStatusFilter,
  search,
  onSearchChange,
  searchPlaceholder,
  hideStatusTabs = false,
  statusOptions = ['all', 'actif', 'en_pause', 'termine'],
}: {
  statusFilter: ProjectStatus | 'all'
  onStatusFilter: (s: ProjectStatus | 'all') => void
  search: string
  onSearchChange: (q: string) => void
  searchPlaceholder?: string
  hideStatusTabs?: boolean
  statusOptions?: readonly (ProjectStatus | 'all')[]
}) {
  if (hideStatusTabs) return null

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatusFilter(s)}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            {s === 'all' ? 'Tous' : PROJECT_STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <div className="relative w-full sm:max-w-xs sm:shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800"
        />
      </div>
    </div>
  )
}

function Td({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <td
      className={clsx(
        'whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300',
        className,
      )}
    >
      {children}
    </td>
  )
}

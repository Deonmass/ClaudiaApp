import clsx from 'clsx'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Button } from './Button'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortable?: boolean
  sortValue?: (row: T) => string | number
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchKeys?: ((row: T) => string)[]
  searchPlaceholder?: string
  pageSize?: number
  actions?: (row: T) => ReactNode
  emptyMessage?: string
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKeys,
  searchPlaceholder = 'Rechercher…',
  pageSize = 10,
  actions,
  emptyMessage = 'Aucune donnée',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    let rows = data
    if (search.trim() && searchKeys) {
      const q = search.toLowerCase()
      rows = rows.filter((row) =>
        searchKeys.some((fn) => fn(row).toLowerCase().includes(q)),
      )
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      if (col?.sortValue) {
        rows = [...rows].sort((a, b) => {
          const va = col.sortValue!(a)
          const vb = col.sortValue!(b)
          const cmp = va < vb ? -1 : va > vb ? 1 : 0
          return sortDir === 'asc' ? cmp : -cmp
        })
      }
    }
    return rows
  }, [data, search, searchKeys, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const toggleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  return (
    <div className="space-y-3">
      {searchKeys && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',
                    col.sortable && 'cursor-pointer select-none hover:text-slate-700',
                  )}
                  onClick={() => toggleSort(col.key, col.sortable)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key &&
                      (sortDir === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300"
                    >
                      {col.render(row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">{actions(row)}</div>
                    </td>
                  )}
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
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

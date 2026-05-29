import type { ReactNode } from 'react'
import { YearSelect } from './YearSelect'

export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <YearSelect />
        </div>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

import clsx from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}

export function Card({ children, className, title, action }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-6">
          {title && (
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'blue',
}: {
  label: string
  value: string | number
  sub?: string
  icon: ReactNode
  accent?: 'blue' | 'green' | 'amber' | 'purple'
}) {
  const accents = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
          )}
        </div>
        <div className={clsx('rounded-lg p-2.5', accents[accent])}>{icon}</div>
      </div>
    </div>
  )
}

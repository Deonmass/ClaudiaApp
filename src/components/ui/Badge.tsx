import clsx from 'clsx'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

const styles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: BadgeVariant
}) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[variant],
      )}
    >
      {children}
    </span>
  )
}

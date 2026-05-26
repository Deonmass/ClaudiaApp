import clsx from 'clsx'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldProps {
  label: string
  error?: string
  required?: boolean
}

export function Input({
  label,
  error,
  required,
  className,
  id,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id ?? label.replace(/\s/g, '-').toLowerCase()
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={fieldId}
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
          error && 'border-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Select({
  label,
  error,
  required,
  className,
  id,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldId = id ?? label.replace(/\s/g, '-').toLowerCase()
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select
        id={fieldId}
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Textarea({
  label,
  error,
  required,
  className,
  id,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id ?? label.replace(/\s/g, '-').toLowerCase()
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <textarea
        id={fieldId}
        rows={3}
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
          error && 'border-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

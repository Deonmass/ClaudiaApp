import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'md' | 'lg' | 'xl' | '2xl'
  /** Au-dessus des modals plein écran (ex. détail projet) */
  elevated?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  elevated = false,
}: ModalProps) {
  if (!open) return null

  const widths = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
  }
  const z = elevated ? 'z-[70]' : 'z-50'

  return (
    <div className={`fixed inset-0 ${z} flex items-end justify-center p-4 sm:items-center`}>
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full ${widths[size]} max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900`}
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

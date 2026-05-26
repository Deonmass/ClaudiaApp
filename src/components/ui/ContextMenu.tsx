import clsx from 'clsx'
import { useEffect, useRef, type ReactNode } from 'react'

export interface ContextMenuItem {
  id: string
  label: string
  icon: ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [onClose])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let left = x
    let top = y
    if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 8
    if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - 8
    el.style.left = `${left}px`
    el.style.top = `${top}px`
  }, [x, y, items])

  return (
    <div
      ref={ref}
      className="animate-context-menu fixed z-[100] min-w-[200px] origin-top-left rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-600 dark:bg-slate-800"
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onClick()
            onClose()
          }}
          className={clsx(
            'group flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]',
            item.danger
              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
              : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/80',
            item.disabled && 'pointer-events-none opacity-40',
          )}
        >
          <span
            className={clsx(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
              item.danger
                ? 'bg-red-100 text-red-600 dark:bg-red-900/50'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
            )}
          >
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  )
}

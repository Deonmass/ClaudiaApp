import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useData } from '../../contexts/DataContext'
import { useLayout } from '../../contexts/LayoutContext'
import { useTheme } from '../../contexts/ThemeContext'
import { ROLE_LABELS } from '../../types'
import { Button } from '../ui/Button'

export function Header() {
  const { user, logout } = useAuth()
  const { data } = useData()
  const { theme, toggleTheme } = useTheme()
  const { setMobileOpen } = useLayout()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
            {data.settings.companyName}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
            Gestion des opérations — Kinshasa
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 sm:px-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              <User className="h-4 w-4" />
            </span>
            <span className="hidden max-w-[120px] truncate font-medium text-slate-800 dark:text-slate-200 sm:inline">
              {user?.fullName}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="font-medium text-slate-900 dark:text-white">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user && ROLE_LABELS[user.role]}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

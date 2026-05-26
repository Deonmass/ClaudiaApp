import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import {
  loadSidebarExpanded,
  saveSidebarExpanded,
} from '../lib/storage'

interface LayoutContextValue {
  sidebarExpanded: boolean
  toggleSidebar: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(() =>
    loadSidebarExpanded(),
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleSidebar = useCallback(() => {
    setSidebarExpanded((v) => {
      const next = !v
      saveSidebarExpanded(next)
      return next
    })
  }, [])

  return (
    <LayoutContext.Provider
      value={{ sidebarExpanded, toggleSidebar, mobileOpen, setMobileOpen }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider')
  return ctx
}

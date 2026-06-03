import clsx from 'clsx'
import {
  Banknote,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
  FolderKanban,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useData } from '../../contexts/DataContext'
import { useLayout } from '../../contexts/LayoutContext'
import type { PermissionModuleId } from '../../lib/permissions'
import type { UserRole } from '../../types'

interface NavChild {
  to: string
  label: string
  roles?: UserRole[]
  module?: PermissionModuleId
  permission?: import('../../lib/permissions').PermissionAction
  match?: (path: string) => boolean
}

interface NavItem {
  id: PermissionModuleId
  to?: string
  label: string
  icon: typeof LayoutDashboard
  roles?: UserRole[]
  accent: string
  bar: string
  children?: NavChild[]
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    to: '/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    accent: 'text-blue-400',
    bar: 'bg-blue-500',
  },
  {
    id: 'projects',
    label: 'Projets',
    icon: FolderKanban,
    accent: 'text-indigo-400',
    bar: 'bg-indigo-500',
    children: [
      {
        to: '/projects/en-cours',
        label: 'En cours',
        module: 'projects',
        permission: 'view',
        match: (p) => p.startsWith('/projects/en-cours') || p === '/projects',
      },
      {
        to: '/projects/cloture',
        label: 'Clôturés',
        module: 'projects',
        permission: 'view_closed',
        match: (p) => p.startsWith('/projects/cloture'),
      },
    ],
  },
  {
    id: 'cash',
    to: '/cash',
    label: 'Caisse',
    icon: Banknote,
    accent: 'text-amber-400',
    bar: 'bg-amber-500',
  },
  {
    id: 'clients',
    to: '/clients',
    label: 'Clients',
    icon: Users,
    accent: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  {
    id: 'agents',
    to: '/agents',
    label: 'Utilisateurs',
    icon: UserCog,
    accent: 'text-purple-400',
    bar: 'bg-purple-500',
  },
  {
    id: 'attendance',
    label: 'Pointage',
    icon: CalendarCheck,
    accent: 'text-cyan-400',
    bar: 'bg-cyan-500',
    children: [
      {
        to: '/attendance',
        label: 'Grille mensuelle',
        module: 'attendance',
        permission: 'view',
        match: (p) => p === '/attendance',
      },
      {
        to: '/attendance/rapport',
        label: 'Rapport des présences',
        module: 'attendance',
        permission: 'view_report',
        match: (p) => p.startsWith('/attendance/rapport'),
      },
    ],
  },
  {
    id: 'settings',
    to: '/settings',
    label: 'Paramètres',
    icon: Settings,
    accent: 'text-slate-400',
    bar: 'bg-slate-500',
  },
]

function NavBar({ bar, active }: { bar: string; active: boolean }) {
  return (
    <span
      className={clsx(
        'absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full transition-opacity',
        bar,
        active ? 'opacity-100' : 'opacity-35 group-hover:opacity-70',
      )}
      aria-hidden
    />
  )
}

/** Pas de fond clair sur l’élément actif — barre colorée + texte accent uniquement */
const navLinkBase =
  'bg-transparent shadow-none outline-none ring-0 hover:bg-transparent focus:bg-transparent focus-visible:ring-2 focus-visible:ring-primary-500/40 active:bg-transparent'

function navLinkInactive() {
  return clsx(navLinkBase, 'text-slate-400 hover:text-slate-200')
}

function navLinkActive(accent: string) {
  return clsx(navLinkBase, 'font-semibold', accent)
}

export function Sidebar() {
  const { sidebarExpanded, toggleSidebar, mobileOpen, setMobileOpen } = useLayout()
  const { canAccessModule, canPerform, isAdmin } = useAuth()

  const childVisible = (child: NavChild) => {
    if (isAdmin) return true
    if (child.module && child.permission) {
      return canPerform(child.module, child.permission)
    }
    if (child.module) return canAccessModule(child.module)
    return true
  }
  const { data } = useData()
  const location = useLocation()
  const logoSrc = data.settings.logo || '/logo.svg'
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    projects: location.pathname.startsWith('/projects'),
    attendance: location.pathname.startsWith('/attendance'),
  }))

  useEffect(() => {
    if (location.pathname.startsWith('/projects')) {
      setOpenGroups((g) => ({ ...g, projects: true }))
    }
    if (location.pathname.startsWith('/attendance')) {
      setOpenGroups((g) => ({ ...g, attendance: true }))
    }
  }, [location.pathname])

  const visible = navItems.filter((item) => {
    if (isAdmin) return true
    if (item.children) {
      return item.children.some((c) => childVisible(c))
    }
    return canAccessModule(item.id)
  })

  const padding = sidebarExpanded ? 'pl-4 pr-3' : 'justify-center px-0'

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-slate-800 bg-slate-900 text-slate-100 transition-all duration-300',
          sidebarExpanded ? 'w-60' : 'w-[4.5rem]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div
          className={clsx(
            'border-b border-slate-800 px-3 py-4',
            sidebarExpanded ? '' : 'flex flex-col items-center',
          )}
        >
          <div
            className={clsx(
              'flex items-center gap-3',
              sidebarExpanded ? 'justify-between' : 'flex-col',
            )}
          >
            <div
              className={clsx(
                'flex items-center gap-3',
                !sidebarExpanded && 'flex-col',
              )}
            >
              <img
                src={logoSrc}
                alt="Logo"
                className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-700"
              />
              {sidebarExpanded && (
                <span className="text-sm font-bold leading-tight text-primary-400">
                  Gestion Ops
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              className={clsx(
                'hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:block',
                !sidebarExpanded && 'mt-2',
              )}
              aria-label={sidebarExpanded ? 'Réduire le menu' : 'Étendre le menu'}
            >
              {sidebarExpanded ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 [&_a]:bg-transparent [&_a[aria-current=page]]:bg-transparent">
          {visible.map((item) => {
            if (item.children) {
              const childItems = item.children.filter((c) => childVisible(c))
              const groupActive = childItems.some((c) =>
                c.match ? c.match(location.pathname) : location.pathname === c.to,
              )
              const isOpen = openGroups[item.id] !== false
              const firstChild = childItems[0]
              return (
                <div key={item.id}>
                  <div
                    className={clsx(
                      'group relative flex w-full items-center rounded-lg bg-transparent text-sm font-medium transition-colors',
                      groupActive
                        ? item.accent
                        : 'text-slate-400 hover:text-slate-200',
                    )}
                  >
                    <NavBar bar={item.bar} active={groupActive} />
                    {firstChild ? (
                      <NavLink
                        to={firstChild.to}
                        end={
                          firstChild.to === '/attendance' ||
                          firstChild.to === '/projects/en-cours'
                        }
                        title={!sidebarExpanded ? item.label : undefined}
                        onClick={() => {
                          setOpenGroups((g) => ({ ...g, [item.id]: true }))
                          setMobileOpen(false)
                          if (!sidebarExpanded) toggleSidebar()
                        }}
                        className={({ isActive }) =>
                          clsx(
                            navLinkBase,
                            'flex min-w-0 flex-1 items-center gap-3 rounded-lg py-2.5',
                            padding,
                            isActive || groupActive
                              ? navLinkActive(item.accent)
                              : navLinkInactive(),
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              className={clsx(
                                'h-5 w-5 shrink-0',
                                isActive || groupActive ? item.accent : 'text-slate-500',
                              )}
                            />
                            {sidebarExpanded && (
                              <span className="truncate text-left">{item.label}</span>
                            )}
                          </>
                        )}
                      </NavLink>
                    ) : (
                      <span className={clsx('flex flex-1 items-center gap-3 py-2.5', padding)}>
                        <item.icon className="h-5 w-5 shrink-0 text-slate-500" />
                        {sidebarExpanded && <span className="truncate">{item.label}</span>}
                      </span>
                    )}
                    {sidebarExpanded && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenGroups((g) => ({
                            ...g,
                            [item.id]: g[item.id] === false,
                          }))
                        }}
                        className="mr-2 shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-700"
                        aria-label={isOpen ? 'Replier le sous-menu' : 'Déplier le sous-menu'}
                      >
                        <ChevronDown
                          className={clsx(
                            'h-4 w-4 transition-transform',
                            isOpen && 'rotate-180',
                          )}
                        />
                      </button>
                    )}
                  </div>
                  {sidebarExpanded && isOpen && (
                    <div className="relative z-10 ml-3 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2">
                      {childItems.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end={
                            child.to === '/attendance' ||
                            child.to === '/projects/en-cours'
                          }
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            clsx(
                              'group relative flex items-center gap-2 rounded-lg py-2 pl-3 pr-2 text-sm transition-colors',
                              isActive
                                ? navLinkActive(item.accent)
                                : navLinkInactive(),
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span
                                className={clsx(
                                  'h-1.5 w-1.5 shrink-0 rounded-full',
                                  item.bar,
                                  isActive ? 'opacity-100' : 'opacity-40',
                                )}
                              />
                              {child.label}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.id}
                to={item.to!}
                end
                title={!sidebarExpanded ? item.label : undefined}
                onClick={() => {
                  setMobileOpen(false)
                  if (!sidebarExpanded) toggleSidebar()
                }}
                className={({ isActive }) =>
                  clsx(
                    'group relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors',
                    padding,
                    isActive ? navLinkActive(item.accent) : navLinkInactive(),
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <NavBar bar={item.bar} active={isActive} />
                    <item.icon
                      className={clsx(
                        'h-5 w-5 shrink-0',
                        isActive ? item.accent : 'text-slate-500',
                      )}
                    />
                    {sidebarExpanded && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

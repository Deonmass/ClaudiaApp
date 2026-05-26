import clsx from 'clsx'
import { Outlet } from 'react-router-dom'
import { useLayout } from '../../contexts/LayoutContext'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  const { sidebarExpanded } = useLayout()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div
        className={clsx(
          'flex min-h-screen flex-col transition-[margin] duration-300',
          sidebarExpanded ? 'lg:ml-60' : 'lg:ml-[4.5rem]',
        )}
      >
        <Header />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

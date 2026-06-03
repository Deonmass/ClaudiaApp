import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import {
  defaultPermissionsForRole,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionModuleId,
  type UserPermissions,
} from '../../lib/permissions'
import { showSuccessAlert } from '../../lib/swal'
import type { User } from '../../types'

interface UserPermissionsModalProps {
  open: boolean
  user: User | null
  onClose: () => void
  onSave: (userId: string, permissions: UserPermissions) => Promise<void>
}

export function UserPermissionsModal({
  open,
  user,
  onClose,
  onSave,
}: UserPermissionsModalProps) {
  const [activeTab, setActiveTab] = useState<PermissionModuleId>('dashboard')
  const [draft, setDraft] = useState<UserPermissions>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setActiveTab('dashboard')
    setDraft(
      user.permissions && Object.keys(user.permissions).length > 0
        ? structuredClone(user.permissions)
        : defaultPermissionsForRole(user.role),
    )
  }, [open, user])

  if (!user) return null

  const activeModule = PERMISSION_MODULES.find((m) => m.id === activeTab)!

  const toggle = (moduleId: PermissionModuleId, action: PermissionAction) => {
    setDraft((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId]?.[action],
      },
    }))
  }

  const setAllInTab = (enabled: boolean) => {
    setDraft((prev) => ({
      ...prev,
      [activeTab]: Object.fromEntries(
        activeModule.actions.map((a) => [a.key, enabled]),
      ) as Partial<Record<PermissionAction, boolean>>,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(user.id, draft)
      await showSuccessAlert(
        'Permissions enregistrées',
        `Les droits de ${user.fullName} ont été mis à jour.`,
      )
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Permissions — ${user.fullName}`}
      size="2xl"
      elevated
    >
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Définissez les accès par menu de l&apos;application. L&apos;administrateur conserve
        toujours tous les droits.
      </p>

      <div className="flex min-h-[320px] flex-col gap-4 sm:flex-row">
        <div
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 pb-2 sm:w-44 sm:flex-col sm:border-b-0 sm:border-r sm:pr-3 sm:pb-0 dark:border-slate-700"
          role="tablist"
        >
          {PERMISSION_MODULES.map((mod) => (
            <button
              key={mod.id}
              type="button"
              role="tab"
              aria-selected={activeTab === mod.id}
              onClick={() => setActiveTab(mod.id)}
              className={clsx(
                'whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                activeTab === mod.id
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              {mod.label}
            </button>
          ))}
        </div>

        <div className="min-w-0 flex-1" role="tabpanel">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {activeModule.label}
            </h3>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAllInTab(true)}>
                Tout cocher
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAllInTab(false)}>
                Tout décocher
              </Button>
            </div>
          </div>

          <ul className="space-y-2">
            {activeModule.actions.map((action) => {
              const checked = Boolean(draft[activeTab]?.[action.key])
              return (
                <li key={action.key}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      checked={checked}
                      onChange={() => toggle(activeTab, action.key)}
                    />
                    <span className="text-sm text-slate-800 dark:text-slate-200">
                      {action.label}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Plus tard
        </Button>
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer les permissions'}
        </Button>
      </div>
    </Modal>
  )
}

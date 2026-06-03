import { Pencil, Plus, Shield, Trash2, UserX } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { UserPermissionsModal } from '../components/agents/UserPermissionsModal'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeading } from '../components/ui/PageHeading'
import type { Column } from '../components/ui/DataTable'
import { DataTable } from '../components/ui/DataTable'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import {
  duplicateUserAlertMessage,
  formatSupabaseError,
  isDuplicateUserError,
} from '../lib/supabase-errors'
import { getUserDeleteBlocker } from '../lib/user-delete'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../lib/swal'
import type { User, UserRole, UserStatus } from '../types'
import { ROLE_LABELS } from '../types'
import type { UserPermissions } from '../lib/permissions'

export function AgentsPage() {
  const { isAdmin, user: currentUser } = useAuth()
  const { data, addUser, updateUser, deactivateUser, deleteUser } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null)

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Nom complet',
      sortable: true,
      sortValue: (u) => u.fullName,
      render: (u) => u.fullName,
    },
    { key: 'phone', header: 'Téléphone', render: (u) => u.phone },
    {
      key: 'role',
      header: 'Rôle',
      render: (u) => <Badge variant="info">{ROLE_LABELS[u.role]}</Badge>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (u) => (
        <Badge variant={u.status === 'actif' ? 'success' : 'danger'}>
          {u.status === 'actif' ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
  ]

  const savePermissions = async (userId: string, permissions: UserPermissions) => {
    const updated = await updateUser(userId, { permissions })
    setPermissionsUser(updated)
  }

  const handleDeactivate = async (row: User) => {
    const result = await showConfirmAlert(
      'Désactiver cet utilisateur ?',
      `${row.fullName} ne pourra plus se connecter. Le compte reste dans la liste (inactif).`,
      'Désactiver',
    )
    if (!result.isConfirmed) return
    try {
      await deactivateUser(row.id)
      await showSuccessAlert('Compte désactivé', `${row.fullName} est maintenant inactif.`)
    } catch (e) {
      await showErrorAlert('Erreur', formatSupabaseError(e))
    }
  }

  const handleDelete = async (row: User) => {
    if (currentUser?.id === row.id) {
      await showErrorAlert('Action impossible', 'Vous ne pouvez pas supprimer votre propre compte.')
      return
    }

    const blocker = getUserDeleteBlocker(row.id, data)
    if (blocker) {
      await showErrorAlert('Suppression impossible', blocker)
      return
    }

    const result = await showConfirmAlert(
      'Supprimer définitivement ?',
      `${row.fullName} sera effacé de la base. Cette action est irréversible.`,
      'Supprimer',
    )
    if (!result.isConfirmed) return

    try {
      await deleteUser(row.id)
      if (permissionsUser?.id === row.id) setPermissionsUser(null)
      await showSuccessAlert('Utilisateur supprimé', `${row.fullName} a été retiré.`)
    } catch (e) {
      await showErrorAlert('Erreur', formatSupabaseError(e))
    }
  }

  if (!isAdmin) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        Accès réservé aux administrateurs.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Utilisateurs"
        description="Gestion des comptes, rôles et permissions"
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Nouvel agent
          </Button>
        }
      />

      <Card>
        <DataTable
          data={data.users}
          columns={columns}
          searchKeys={[(u) => u.fullName, (u) => u.email, (u) => u.username]}
          actions={(row) =>
            row.role !== 'admin' ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Permissions"
                  onClick={() => setPermissionsUser(row)}
                >
                  <Shield className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(row)
                    setModalOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {row.status === 'actif' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Désactiver"
                    onClick={() => void handleDeactivate(row)}
                  >
                    <UserX className="h-4 w-4 text-amber-600" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  title="Supprimer définitivement"
                  onClick={() => void handleDelete(row)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </>
            ) : null
          }
        />
      </Card>

      <AgentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editing}
        onSave={async (form) => {
          if (editing) return updateUser(editing.id, form)
          return addUser({
            fullName: form.fullName!,
            email: form.email!,
            username: form.username!,
            phone: form.phone!,
            role: form.role!,
            password: form.password!,
            status: form.status ?? 'actif',
          })
        }}
        onSaved={(saved) => {
          setModalOpen(false)
          if (saved.role !== 'admin') setPermissionsUser(saved)
        }}
      />

      <UserPermissionsModal
        open={permissionsUser !== null}
        user={permissionsUser}
        onClose={() => setPermissionsUser(null)}
        onSave={savePermissions}
      />
    </div>
  )
}

function AgentFormModal({
  open,
  onClose,
  user,
  onSave,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  user: User | null
  onSave: (form: Partial<User>) => Promise<User>
  onSaved: (user: User) => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('agent')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<UserStatus>('actif')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (user) {
      setFullName(user.fullName)
      setEmail(user.email)
      setUsername(user.username)
      setPhone(user.phone)
      setRole(user.role)
      setPassword('')
      setStatus(user.status)
    } else {
      setFullName('')
      setEmail('')
      setUsername('')
      setPhone('')
      setRole('agent')
      setPassword('agent123')
      setStatus('actif')
    }
    setErrors({})
  }, [open, user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!fullName.trim()) err.fullName = 'Nom requis'
    if (!email.includes('@')) err.email = 'Email invalide'
    if (!username.trim()) err.username = "Nom d'utilisateur requis"
    if (!user && !password) err.password = 'Mot de passe requis'
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }
    setSaving(true)
    try {
      const saved = await onSave({
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        phone: phone.trim(),
        role,
        status,
        ...(password ? { password } : {}),
      })
      onSaved(saved)
    } catch (e) {
      if (isDuplicateUserError(e)) {
        await showErrorAlert('Doublon', duplicateUserAlertMessage(e))
        return
      }
      await showErrorAlert('Erreur', formatSupabaseError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Modifier' : 'Nouvel agent'} size="lg">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Input label="Nom complet" required value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Input label="Login" required value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} />
        </div>
        <Input label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Rôle" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {(Object.keys(ROLE_LABELS) as UserRole[]).filter((r) => r !== 'admin').map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </Select>
          <Select label="Statut" value={status} onChange={(e) => setStatus(e.target.value as UserStatus)}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </Select>
        </div>
        <Input
          label={user ? 'Nouveau mot de passe (vide = inchangé)' : 'Mot de passe'}
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

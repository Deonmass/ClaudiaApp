import { Pencil, Plus, UserX } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
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
import type { User, UserRole, UserStatus } from '../types'
import { ROLE_LABELS } from '../types'

export function AgentsPage() {
  const { isAdmin } = useAuth()
  const { data, addUser, updateUser, deleteUser } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

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
        title="Agents & utilisateurs"
        description="Gestion des comptes et rôles"
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
                    onClick={() => {
                      if (confirm('Désactiver cet utilisateur ?')) deleteUser(row.id)
                    }}
                  >
                    <UserX className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </>
            ) : null
          }
        />
      </Card>

      <AgentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editing}
        onSave={(form) => {
          if (editing) updateUser(editing.id, form)
          else
            addUser({
              fullName: form.fullName!,
              email: form.email!,
              username: form.username!,
              phone: form.phone!,
              role: form.role!,
              password: form.password!,
              status: form.status ?? 'actif',
            })
          setModalOpen(false)
        }}
      />
    </div>
  )
}

function AgentFormModal({
  open,
  onClose,
  user,
  onSave,
}: {
  open: boolean
  onClose: () => void
  user: User | null
  onSave: (form: Partial<User>) => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('agent')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<UserStatus>('actif')
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const handleSubmit = (e: FormEvent) => {
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
    onSave({
      fullName: fullName.trim(),
      email: email.trim(),
      username: username.trim(),
      phone: phone.trim(),
      role,
      status,
      ...(password ? { password } : {}),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Modifier' : 'Nouvel agent'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nom complet" required value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Input label="Login" required value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} />
        </div>
        <Input label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Rôle" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
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
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}

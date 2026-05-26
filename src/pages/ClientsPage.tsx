import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import type { Column } from '../components/ui/DataTable'
import { DataTable } from '../components/ui/DataTable'
import { Input, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { useData } from '../contexts/DataContext'
import { formatDate } from '../lib/utils'
import type { Client } from '../types'

export function ClientsPage() {
  const { data, addClient, updateClient, deleteClient } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const list = data.clients.filter((c) => showInactive || c.active)

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Nom / Raison sociale',
      sortable: true,
      sortValue: (c) => c.name,
      render: (c) => (
        <span className="flex items-center gap-2 font-medium">
          {c.name}
          {!c.active && <Badge variant="default">Inactif</Badge>}
        </span>
      ),
    },
    { key: 'phone', header: 'Téléphone', render: (c) => c.phone },
    { key: 'email', header: 'Email', render: (c) => c.email },
    {
      key: 'address',
      header: 'Adresse',
      render: (c) => c.address ?? '—',
    },
    {
      key: 'created',
      header: 'Création',
      sortable: true,
      sortValue: (c) => c.createdAt,
      render: (c) => formatDate(c.createdAt),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Clients</h2>
          <p className="text-sm text-slate-500">Gestion de la clientèle</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      <Card>
        <label className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Afficher les clients désactivés
        </label>
        <DataTable
          data={list}
          columns={columns}
          searchKeys={[(c) => c.name, (c) => c.email, (c) => c.phone]}
          actions={(row) => (
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
              {row.active && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Désactiver ce client ?')) deleteClient(row.id)
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </>
          )}
        />
      </Card>

      <ClientFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        client={editing}
        onSave={(form) => {
          if (editing) updateClient(editing.id, form)
          else
            addClient({
              name: form.name!,
              phone: form.phone!,
              email: form.email!,
              address: form.address,
              notes: form.notes,
              internalRef: form.internalRef,
            })
          setModalOpen(false)
        }}
      />
    </div>
  )
}

function ClientFormModal({
  open,
  onClose,
  client,
  onSave,
}: {
  open: boolean
  onClose: () => void
  client: Client | null
  onSave: (form: Partial<Client>) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [internalRef, setInternalRef] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (client) {
      setName(client.name)
      setPhone(client.phone)
      setEmail(client.email)
      setAddress(client.address ?? '')
      setNotes(client.notes ?? '')
      setInternalRef(client.internalRef ?? '')
    } else {
      setName('')
      setPhone('')
      setEmail('')
      setAddress('')
      setNotes('')
      setInternalRef('')
    }
    setErrors({})
  }, [open, client])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!name.trim()) err.name = 'Nom requis'
    if (!phone.trim()) err.phone = 'Téléphone requis'
    if (!email.trim() || !email.includes('@')) err.email = 'Email valide requis'
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      internalRef: internalRef.trim() || undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? 'Modifier le client' : 'Nouveau client'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nom / Raison sociale" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Téléphone" required value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        </div>
        <Input label="Adresse" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label="Référence interne" value={internalRef} onChange={(e) => setInternalRef(e.target.value)} />
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}

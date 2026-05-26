import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProjectDetailModal } from '../components/projects/ProjectDetailModal'
import {
  ProjectsTable,
  ProjectsToolbar,
  type ProjectRow,
} from '../components/projects/ProjectsTable'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useData } from '../contexts/DataContext'
import {
  formatDate,
  formatMoney,
  formatProjectDuration,
  projectCashTotals,
} from '../lib/utils'
import type { Project, ProjectStatus, User, UserRole } from '../types'
import { PROJECT_STATUS_LABELS, ROLE_LABELS } from '../types'

const statusVariant: Record<ProjectStatus, 'success' | 'default' | 'warning'> = {
  actif: 'success',
  termine: 'default',
  en_pause: 'warning',
}

export type ProjectsView = 'en-cours' | 'cloture'

export function ProjectsPage({ view = 'en-cours' }: { view?: ProjectsView }) {
  const { data, addProject, updateProject, archiveProject } = useData()
  const navigate = useNavigate()
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [editing, setEditing] = useState<Project | null>(null)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const managers = data.users.filter((u) => u.status === 'actif')

  const viewTitle =
    view === 'cloture' ? 'Projets clôturés' : 'Projets en cours'

  const rows: ProjectRow[] = useMemo(() => {
    let projects = data.projects
    if (view === 'en-cours') {
      projects = projects.filter((p) => p.status === 'actif' || p.status === 'en_pause')
    } else if (view === 'cloture') {
      projects = projects.filter((p) => p.status === 'termine')
    }
    if (statusFilter !== 'all') {
      projects = projects.filter((p) => p.status === statusFilter)
    }
    return projects.map((p) => {
      const { entrees, sorties, marge } = projectCashTotals(
        data.cashMovements,
        p.id,
      )
      return { ...p, entrees, sorties, marge }
    })
  }, [data.projects, data.cashMovements, statusFilter, view])

  const openCreate = () => {
    setEditing(null)
    setFormModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{viewTitle}</h2>
          <p className="text-sm text-slate-500">
            Gestion et suivi — clic sur le code ou clic droit pour les actions
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      <Card>
        <ProjectsToolbar
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par nom ou code…"
          statusOptions={
            view === 'cloture'
              ? (['all', 'termine'] as const)
              : (['all', 'actif', 'en_pause'] as const)
          }
        />

        <ProjectsTable
          data={rows}
          formatMoney={formatMoney}
          formatDate={(d) => formatDate(d)}
          formatDuration={(p) =>
            formatProjectDuration(p.createdAt, p.endDate, p.status)
          }
          managerName={(id) =>
            data.users.find((u) => u.id === id)?.fullName ?? '—'
          }
          statusVariant={statusVariant}
          onOpen={setDetailProject}
          onEdit={(p) => {
            setEditing(p)
            setFormModalOpen(true)
          }}
          onArchive={(p) => {
            if (confirm('Clôturer ce projet ?')) {
              archiveProject(p.id)
              if (view === 'en-cours') navigate('/projects/cloture')
            }
          }}
          search={search}
        />
      </Card>

      <ProjectDetailModal
        project={detailProject}
        onClose={() => setDetailProject(null)}
        onProjectChange={setDetailProject}
      />

      <ProjectFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        project={editing}
        managers={managers}
        onSave={(form) => {
          if (editing) updateProject(editing.id, form)
          else
            addProject({
              name: form.name!,
              description: form.description,
              managerId: form.managerId!,
              startDate: form.startDate!,
              endDate: form.endDate,
              status: form.status ?? 'actif',
            })
          setFormModalOpen(false)
        }}
      />
    </div>
  )
}

function ProjectFormModal({
  open,
  onClose,
  project,
  managers,
  onSave,
}: {
  open: boolean
  onClose: () => void
  project: Project | null
  managers: User[]
  onSave: (form: Partial<Project>) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [managerId, setManagerId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('actif')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (project) {
      setName(project.name)
      setDescription(project.description ?? '')
      setManagerId(project.managerId)
      setStartDate(project.startDate)
      setEndDate(project.endDate ?? '')
      setStatus(project.status)
    } else {
      setName('')
      setDescription('')
      setManagerId(managers[0]?.id ?? '')
      setStartDate(new Date().toISOString().slice(0, 10))
      setEndDate('')
      setStatus('actif')
    }
    setErrors({})
  }, [open, project, managers])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!name.trim()) err.name = 'Nom requis'
    if (!managerId) err.managerId = 'Responsable requis'
    if (!startDate) err.startDate = 'Date de début requise'
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      managerId,
      startDate,
      endDate: endDate || undefined,
      status,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? 'Modifier le projet' : 'Nouveau projet'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {project && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
            Code : <strong>{project.code}</strong> (non modifiable)
          </div>
        )}
        <Input
          label="Nom du projet"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Select
          label="Responsable"
          required
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          error={errors.managerId}
        >
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName} — {ROLE_LABELS[m.role as UserRole]}
            </option>
          ))}
        </Select>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Date de début"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.startDate}
          />
          <Input
            label="Date de fin prévue"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Select
          label="Statut"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
        >
          {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
            <option key={s} value={s}>
              {PROJECT_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">{project ? 'Enregistrer' : 'Créer'}</Button>
        </div>
      </form>
    </Modal>
  )
}

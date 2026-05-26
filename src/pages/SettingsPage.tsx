import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import type { AppSettings } from '../types'

export function SettingsPage() {
  const { isAdmin } = useAuth()
  const { data, updateSettings, refresh } = useData()
  const [form, setForm] = useState<AppSettings>(data.settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(data.settings)
  }, [data.settings])

  if (!isAdmin) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        Accès réservé aux administrateurs.
      </p>
    )
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    updateSettings({ ...form, currency: 'USD' })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const patch = (key: keyof AppSettings, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Paramètres</h2>
        <p className="text-sm text-slate-500">Configuration générale de l&apos;application</p>
      </div>

      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40">
          Paramètres enregistrés.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Paramètres généraux">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nom de l'entreprise"
              value={form.companyName}
              onChange={(e) => patch('companyName', e.target.value)}
              required
            />
            <Input
              label="Téléphone"
              value={form.phone}
              onChange={(e) => patch('phone', e.target.value)}
            />
            <Input
              label="Adresse"
              value={form.address}
              onChange={(e) => patch('address', e.target.value)}
              className="sm:col-span-2"
            />
            <Input
              label="URL du logo (optionnel)"
              value={form.logo ?? ''}
              onChange={(e) => patch('logo', e.target.value)}
              className="sm:col-span-2"
            />
          </div>
        </Card>

        <Card title="Paramètres de caisse">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Devise de l&apos;application :{' '}
            <strong className="text-slate-900 dark:text-white">USD ($)</strong>
          </p>
        </Card>

        <Card title="Paramètres de pointage">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Heure de début"
              type="time"
              value={form.workStart}
              onChange={(e) => patch('workStart', e.target.value)}
            />
            <Input
              label="Heure de fin"
              type="time"
              value={form.workEnd}
              onChange={(e) => patch('workEnd', e.target.value)}
            />
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit">Enregistrer les paramètres</Button>
          <Button type="button" variant="secondary" onClick={() => void refresh()}>
            Actualiser depuis la base
          </Button>
        </div>
      </form>
    </div>
  )
}

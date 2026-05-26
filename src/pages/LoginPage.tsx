import { Building2, Lock, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function LoginPage() {
  const { user, login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = login(username.trim(), password)
    setLoading(false)
    if (err) setError(err)
    else navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex justify-end p-4">
        <Button variant="ghost" size="sm" onClick={toggleTheme}>
          {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Gestion Opérations
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Administration — Kinshasa, RDC
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-8"
          >
            <h2 className="mb-6 text-lg font-semibold text-slate-800 dark:text-slate-100">
              Connexion
            </h2>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-[2.35rem] h-4 w-4 text-slate-400" />
                <Input
                  label="Email ou nom d'utilisateur"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-[2.35rem] h-4 w-4 text-slate-400" />
                <Input
                  label="Mot de passe"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>

            <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Utilisez un compte enregistré dans la base de données.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

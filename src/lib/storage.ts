const AUTH_KEY = 'gestion-operations-auth'
const THEME_KEY = 'gestion-operations-theme'
const SIDEBAR_KEY = 'gestion-operations-sidebar'
/** Ancien stockage local des données — supprimé au démarrage */
const LEGACY_DATA_KEY = 'gestion-operations-data'

export function clearLegacyAppData(): void {
  localStorage.removeItem(LEGACY_DATA_KEY)
}

export function loadAuthUserId(): string | null {
  return localStorage.getItem(AUTH_KEY)
}

export function saveAuthUserId(userId: string | null): void {
  if (userId) localStorage.setItem(AUTH_KEY, userId)
  else localStorage.removeItem(AUTH_KEY)
}

export type ThemeMode = 'light' | 'dark'

export function loadTheme(): ThemeMode {
  const t = localStorage.getItem(THEME_KEY)
  if (t === 'dark' || t === 'light') return t
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function saveTheme(theme: ThemeMode): void {
  localStorage.setItem(THEME_KEY, theme)
}

export function loadSidebarExpanded(): boolean {
  return localStorage.getItem(SIDEBAR_KEY) === 'true'
}

export function saveSidebarExpanded(expanded: boolean): void {
  localStorage.setItem(SIDEBAR_KEY, String(expanded))
}

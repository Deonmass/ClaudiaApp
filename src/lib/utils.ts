import { differenceInDays, format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { AppSettings, CashMovement } from '../types'

export const APP_CURRENCY = 'USD' as const

export function generateId(): string {
  return crypto.randomUUID()
}

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'dd/MM/yyyy', { locale: fr })
  } catch {
    return date
  }
}

export function formatDateTime(date: string): string {
  try {
    return format(parseISO(date), 'dd/MM/yyyy HH:mm', { locale: fr })
  } catch {
    return date
  }
}

/** Montants en USD — format : 2 000 000 $ */
export function formatMoney(amount: number): string {
  const negative = amount < 0
  const abs = Math.abs(amount)
  const hasDecimals = Math.round(abs * 100) % 100 !== 0
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs)
  const normalized = formatted.replace(/\u00A0/g, ' ')
  return `${negative ? '- ' : ''}${normalized} $`
}

export function projectCode(year: number, seq: number): string {
  return `PROJ-${year}-${String(seq).padStart(4, '0')}`
}

export function projectCashTotals(
  movements: CashMovement[],
  projectId: string,
): { entrees: number; sorties: number; marge: number } {
  const filtered = movements.filter((m) => m.projectId === projectId)
  const entrees = filtered
    .filter((m) => m.type === 'entree')
    .reduce((s, m) => s + m.amount, 0)
  const sorties = filtered
    .filter((m) => m.type === 'sortie')
    .reduce((s, m) => s + m.amount, 0)
  return { entrees, sorties, marge: entrees - sorties }
}

export function formatProjectDuration(
  createdAt: string,
  endDate?: string,
  status?: string,
): string {
  try {
    const start = parseISO(createdAt)
    const end =
      status === 'termine' && endDate ? parseISO(endDate) : new Date()
    const days = Math.max(0, differenceInDays(end, start))
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return '1 jour'
    if (days < 30) return `${days} jours`
    const months = Math.floor(days / 30)
    const rest = days % 30
    if (months < 12) {
      return rest > 0 ? `${months} mois ${rest} j` : `${months} mois`
    }
    const years = Math.floor(months / 12)
    return `${years} an${years > 1 ? 's' : ''}`
  } catch {
    return '—'
  }
}

export function cashBalance(movements: CashMovement[], projectId?: string): number {
  const filtered = projectId
    ? movements.filter((m) => m.projectId === projectId)
    : movements
  return filtered.reduce(
    (sum, m) => sum + (m.type === 'entree' ? m.amount : -m.amount),
    0,
  )
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const content = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function defaultSettings(): AppSettings {
  return {
    companyName: 'Gestion Opérations — Kinshasa',
    address: 'Gombe, Kinshasa, RDC',
    phone: '+243 000 000 000',
    currency: APP_CURRENCY,
    workStart: '08:00',
    workEnd: '17:00',
  }
}

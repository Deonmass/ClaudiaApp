import { parseISO } from 'date-fns'
import type { AppData } from '../types'

const STORAGE_KEY = 'gestion-ops-selected-year'

export function yearFromDate(dateStr: string): number {
  try {
    return parseISO(dateStr).getFullYear()
  } catch {
    return new Date().getFullYear()
  }
}

export function loadStoredYear(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const y = Number(raw)
  return Number.isInteger(y) ? y : null
}

export function storeSelectedYear(year: number): void {
  localStorage.setItem(STORAGE_KEY, String(year))
}

export function collectAvailableYears(data: AppData): number[] {
  const years = new Set<number>()
  years.add(new Date().getFullYear())

  data.cashMovements.forEach((m) => years.add(yearFromDate(m.date)))
  data.attendance.forEach((a) => years.add(yearFromDate(a.date)))
  data.projects.forEach((p) => {
    years.add(yearFromDate(p.startDate))
    years.add(yearFromDate(p.createdAt))
    if (p.endDate) years.add(yearFromDate(p.endDate))
  })
  data.clients.forEach((c) => years.add(yearFromDate(c.createdAt)))

  return [...years].sort((a, b) => b - a)
}

export function filterAppDataByYear(data: AppData, year: number): AppData {
  const cashMovements = data.cashMovements.filter(
    (m) => yearFromDate(m.date) === year,
  )
  const attendance = data.attendance.filter((a) => yearFromDate(a.date) === year)

  const projectIdsWithActivity = new Set<string>()
  cashMovements.forEach((m) => projectIdsWithActivity.add(m.projectId))
  attendance.forEach((a) => {
    if (a.projectId) projectIdsWithActivity.add(a.projectId)
  })

  const projects = data.projects.filter(
    (p) =>
      yearFromDate(p.startDate) === year ||
      yearFromDate(p.createdAt) === year ||
      (p.endDate && yearFromDate(p.endDate) === year) ||
      projectIdsWithActivity.has(p.id),
  )

  const clientIds = new Set(
    projects.map((p) => p.clientId).filter((id): id is string => Boolean(id)),
  )

  const clients = data.clients.filter(
    (c) => yearFromDate(c.createdAt) === year || clientIds.has(c.id),
  )

  return {
    ...data,
    cashMovements,
    attendance,
    projects,
    clients,
  }
}

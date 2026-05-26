import {
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from 'date-fns'
import type { CashMovement } from '../types'

export type CashPeriodFilter =
  | 'all'
  | 'week'
  | 'month'
  | 'quarter'
  | 'interval'

export type CashTypeFilter = 'all' | 'entree' | 'sortie'

export interface CashDateRange {
  from: string
  to: string
}

export function defaultDateRange(period: CashPeriodFilter): CashDateRange {
  const today = format(new Date(), 'yyyy-MM-dd')
  const now = new Date()
  switch (period) {
    case 'week':
      return {
        from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        to: today,
      }
    case 'month':
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: today,
      }
    case 'quarter':
      return {
        from: format(startOfQuarter(now), 'yyyy-MM-dd'),
        to: today,
      }
    case 'interval':
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: today,
      }
    default:
      return { from: today, to: today }
  }
}

export function filterMovementsByPeriod(
  movements: CashMovement[],
  period: CashPeriodFilter,
  range?: CashDateRange,
): CashMovement[] {
  if (period === 'all') return movements

  if (period === 'interval' && range?.from && range?.to) {
    const start = parseISO(range.from)
    const end = parseISO(range.to)
    return movements.filter((m) => {
      const d = parseISO(m.date)
      return isWithinInterval(d, { start, end })
    })
  }

  if (period === 'quarter' && range?.from && range?.to) {
    const start = parseISO(range.from)
    const end = parseISO(range.to)
    return movements.filter((m) => {
      const d = parseISO(m.date)
      return isWithinInterval(d, { start, end })
    })
  }

  const now = new Date()
  let start: Date
  let end: Date

  switch (period) {
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 })
      end = endOfWeek(now, { weekStartsOn: 1 })
      break
    case 'month':
      start = startOfMonth(now)
      end = endOfMonth(now)
      break
    default:
      return movements
  }

  return movements.filter((m) => {
    const d = parseISO(m.date)
    return isWithinInterval(d, { start, end })
  })
}

export function sumByType(
  movements: CashMovement[],
  type: 'entree' | 'sortie',
): number {
  return movements
    .filter((m) => m.type === type)
    .reduce((s, m) => s + m.amount, 0)
}

export function showDateRangeInputs(period: CashPeriodFilter): boolean {
  return period === 'quarter' || period === 'interval'
}

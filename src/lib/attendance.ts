import type { AttendanceStatus } from '../types'

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  'present',
  'absent',
  'retard',
  'malade',
]

export const ATTENDANCE_STATUS_LETTER: Record<AttendanceStatus, string> = {
  present: 'P',
  absent: 'A',
  retard: 'R',
  malade: 'M',
}

export const ATTENDANCE_STATUS_CELL: Record<
  AttendanceStatus,
  { bg: string; text: string; hover: string }
> = {
  present: {
    bg: 'bg-emerald-500',
    text: 'text-white',
    hover: 'hover:bg-emerald-600',
  },
  absent: {
    bg: 'bg-red-500',
    text: 'text-white',
    hover: 'hover:bg-red-600',
  },
  retard: {
    bg: 'bg-amber-500',
    text: 'text-white',
    hover: 'hover:bg-amber-600',
  },
  malade: {
    bg: 'bg-violet-500',
    text: 'text-white',
    hover: 'hover:bg-violet-600',
  },
}

export const ATTENDANCE_STATUS_MODAL: Record<
  AttendanceStatus,
  { ring: string; btn: string }
> = {
  present: {
    ring: 'ring-emerald-500',
    btn: 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
  absent: {
    ring: 'ring-red-500',
    btn: 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  },
  retard: {
    ring: 'ring-amber-500',
    btn: 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  },
  malade: {
    ring: 'ring-violet-500',
    btn: 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
  },
}

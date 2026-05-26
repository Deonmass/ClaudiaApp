import type { AppData, CashMovement, User } from '../types'
import { APP_CURRENCY, generateId } from './utils'

/** Garantit un compte Admin actif (corrige les données localStorage corrompues ou anciennes). */
export function migrateData(data: AppData): AppData {
  let users = [...data.users]

  const adminIndex = users.findIndex(
    (u) =>
      u.role === 'admin' ||
      u.username?.toLowerCase() === 'admin' ||
      u.email?.toLowerCase() === 'admin@gestion-ops.cd',
  )

  const defaultAdmin: User = {
    id: adminIndex >= 0 ? users[adminIndex].id : generateId(),
    fullName: 'Administrateur',
    email: 'admin@gestion-ops.cd',
    username: 'Admin',
    phone: '+243 900 000 001',
    role: 'admin',
    password: 'admin',
    status: 'actif',
  }

  if (adminIndex >= 0) {
    users[adminIndex] = {
      ...users[adminIndex],
      ...defaultAdmin,
      id: users[adminIndex].id,
    }
  } else {
    users = [defaultAdmin, ...users]
  }

  users = users.map((u) => ({
    ...u,
    username: u.username ?? u.email.split('@')[0],
  }))

  const cashMovements: CashMovement[] = data.cashMovements.map((m) => ({
    ...m,
    source:
      m.source ??
      (m.type === 'entree' ? 'Client / projet' : undefined),
    beneficiary:
      m.beneficiary ??
      (m.type === 'sortie' ? 'Fournisseur' : undefined),
  }))

  const settings = {
    ...(data.settings?.companyName
      ? data.settings
      : {
          companyName: 'Gestion Opérations — Kinshasa',
          address: 'Gombe, Kinshasa, RDC',
          phone: '+243 000 000 000',
          workStart: '08:00',
          workEnd: '17:00',
        }),
    currency: APP_CURRENCY,
    logo: data.settings?.logo,
  }

  const attendance = data.attendance.map((a) => ({
    ...a,
    status:
      (a.status as string) === 'conge'
        ? ('malade' as const)
        : a.status,
  }))

  return { ...data, users, settings, cashMovements, attendance }
}

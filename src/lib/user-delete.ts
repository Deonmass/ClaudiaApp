import type { AppData } from '../types'

export function getUserDeleteBlocker(
  userId: string,
  data: Pick<AppData, 'projects' | 'cashMovements'>,
): string | null {
  const managed = data.projects.filter((p) => p.managerId === userId)
  if (managed.length > 0) {
    const names = managed.slice(0, 3).map((p) => p.name)
    const extra = managed.length > 3 ? ` (+${managed.length - 3})` : ''
    return `Responsable du projet : ${names.join(', ')}${extra}. Réassignez un autre responsable avant suppression.`
  }

  const movements = data.cashMovements.filter((m) => m.agentId === userId)
  if (movements.length > 0) {
    return `${movements.length} opération(s) de caisse liée(s) à cet utilisateur. Suppression impossible.`
  }

  return null
}

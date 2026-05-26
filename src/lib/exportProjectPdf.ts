import { jsPDF } from 'jspdf'
import type { CashMovement, Project, User } from '../types'
import { PROJECT_STATUS_LABELS } from '../types'
import { formatDate, formatMoney, formatProjectDuration, projectCashTotals } from './utils'

export function exportProjectPdf(
  project: Project,
  movements: CashMovement[],
  manager?: User,
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const finance = projectCashTotals(movements, project.id)
  const entrees = movements.filter((m) => m.type === 'entree')
  const sorties = movements.filter((m) => m.type === 'sortie')
  let y = 14

  doc.setFontSize(16)
  doc.text(project.name, 14, y)
  y += 7
  doc.setFontSize(10)
  doc.setTextColor(80)
  doc.text(`${project.code} — ${PROJECT_STATUS_LABELS[project.status]}`, 14, y)
  y += 10
  doc.setTextColor(0)

  const info = [
    `Responsable : ${manager?.fullName ?? '—'}`,
    `Création : ${formatDate(project.createdAt)}`,
    `Durée : ${formatProjectDuration(project.createdAt, project.endDate, project.status)}`,
    `Entrées : ${formatMoney(finance.entrees)} | Sorties : ${formatMoney(finance.sorties)} | Marge : ${formatMoney(finance.marge)}`,
  ]
  info.forEach((line) => {
    doc.text(line, 14, y)
    y += 6
  })
  y += 4

  doc.setFontSize(12)
  doc.text('Entrées', 14, y)
  y += 6
  doc.setFontSize(9)
  entrees.forEach((m) => {
    if (y > 190) {
      doc.addPage()
      y = 14
    }
    doc.text(
      `${formatDate(m.date)} | ${formatMoney(m.amount)} | ${m.description} | ${m.source ?? '—'}`,
      14,
      y,
    )
    y += 5
  })
  y += 6

  if (y > 180) {
    doc.addPage()
    y = 14
  }
  doc.setFontSize(12)
  doc.text('Sorties', 14, y)
  y += 6
  doc.setFontSize(9)
  sorties.forEach((m) => {
    if (y > 190) {
      doc.addPage()
      y = 14
    }
    doc.text(
      `${formatDate(m.date)} | ${formatMoney(m.amount)} | ${m.description} | ${m.beneficiary ?? '—'}`,
      14,
      y,
    )
    y += 5
  })

  doc.save(`${project.code}-rapport.pdf`)
}

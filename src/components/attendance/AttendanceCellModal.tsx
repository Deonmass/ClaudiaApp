import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import {
  ATTENDANCE_STATUS_LETTER,
  ATTENDANCE_STATUS_MODAL,
  ATTENDANCE_STATUSES,
} from '../../lib/attendance'
import type { AttendanceStatus } from '../../types'
import { ATTENDANCE_STATUS_LABELS } from '../../types'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Textarea } from '../ui/Input'

interface AttendanceCellModalProps {
  open: boolean
  onClose: () => void
  agentName: string
  date: string
  initialStatus?: AttendanceStatus
  initialNotes?: string
  onSave: (status: AttendanceStatus, notes: string) => void
  onClear: () => void
}

export function AttendanceCellModal({
  open,
  onClose,
  agentName,
  date,
  initialStatus,
  initialNotes = '',
  onSave,
  onClear,
}: AttendanceCellModalProps) {
  const [status, setStatus] = useState<AttendanceStatus | undefined>(initialStatus)
  const [notes, setNotes] = useState(initialNotes)

  useEffect(() => {
    if (open) {
      setStatus(initialStatus)
      setNotes(initialNotes)
    }
  }, [open, initialStatus, initialNotes])

  const dateLabel = format(parseISO(date), 'EEEE d MMMM yyyy', { locale: fr })

  const handleSave = () => {
    if (!status) return
    onSave(status, notes)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pointage du jour"
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
          <p className="font-medium text-slate-900 dark:text-white">{agentName}</p>
          <p className="text-slate-500 capitalize">{dateLabel}</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Statut
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ATTENDANCE_STATUSES.map((s) => {
              const letter = ATTENDANCE_STATUS_LETTER[s]
              const selected = status === s
              const modalStyle = ATTENDANCE_STATUS_MODAL[s]
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={clsx(
                    'flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all',
                    selected
                      ? clsx(modalStyle.btn, 'ring-2', modalStyle.ring)
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
                  )}
                >
                  <span
                    className={clsx(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold',
                      s === 'present' &&
                        (selected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40'),
                      s === 'absent' &&
                        (selected
                          ? 'bg-red-500 text-white'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40'),
                      s === 'retard' &&
                        (selected
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40'),
                      s === 'malade' &&
                        (selected
                          ? 'bg-violet-500 text-white'
                          : 'bg-violet-100 text-violet-700 dark:bg-violet-900/40'),
                    )}
                  >
                    {letter}
                  </span>
                  <span className="text-xs font-medium">
                    {ATTENDANCE_STATUS_LABELS[s]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <Textarea
          label="Commentaire"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Motif, heure d'arrivée, etc."
        />

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {initialStatus && (
            <Button
              variant="ghost"
              className="mr-auto text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => {
                onClear()
                onClose()
              }}
            >
              Effacer
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!status}>
            Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  )
}

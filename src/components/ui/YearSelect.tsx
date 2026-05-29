import { Calendar } from 'lucide-react'
import { useYearFilter } from '../../contexts/YearFilterContext'

export function YearSelect() {
  const { selectedYear, setSelectedYear, availableYears } = useYearFilter()

  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm shadow-sm dark:border-slate-600 dark:bg-slate-800">
      <Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <span className="sr-only">Année</span>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="cursor-pointer bg-transparent font-semibold text-slate-800 focus:outline-none dark:text-slate-100"
        aria-label="Filtrer par année"
      >
        {availableYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  )
}

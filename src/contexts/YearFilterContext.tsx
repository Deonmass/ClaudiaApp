import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  collectAvailableYears,
  filterAppDataByYear,
  loadStoredYear,
  storeSelectedYear,
} from '../lib/yearFilter'
import type { AppData } from '../types'
import { useData } from './DataContext'

interface YearFilterContextValue {
  selectedYear: number
  setSelectedYear: (year: number) => void
  availableYears: number[]
  filteredData: AppData
}

const YearFilterContext = createContext<YearFilterContextValue | null>(null)

export function YearFilterProvider({ children }: { children: ReactNode }) {
  const { data } = useData()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYearState] = useState(
    () => loadStoredYear() ?? currentYear,
  )

  const availableYears = useMemo(() => collectAvailableYears(data), [data])

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYearState(availableYears[0])
    }
  }, [availableYears, selectedYear])

  const setSelectedYear = useCallback((year: number) => {
    setSelectedYearState(year)
    storeSelectedYear(year)
  }, [])

  const filteredData = useMemo(
    () => filterAppDataByYear(data, selectedYear),
    [data, selectedYear],
  )

  return (
    <YearFilterContext.Provider
      value={{ selectedYear, setSelectedYear, availableYears, filteredData }}
    >
      {children}
    </YearFilterContext.Provider>
  )
}

export function useYearFilter(): YearFilterContextValue {
  const ctx = useContext(YearFilterContext)
  if (!ctx) {
    throw new Error('useYearFilter must be used within YearFilterProvider')
  }
  return ctx
}

/** Données filtrées selon l'année sélectionnée */
export function useFilteredData(): AppData {
  return useYearFilter().filteredData
}

'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { WeekView } from '@/components/calendar/WeekView'
import { MealIdeasPanel } from '@/components/calendar/MealIdeasPanel'

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateShort(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function KalendarzPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const goToPrevWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }, [])

  const goToNextWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }, [])

  const startStr = toDateString(weekStart)
  const endStr = toDateString(weekEnd)

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Kalendarz posilkow
        </h1>
      </div>

      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <button
          onClick={goToPrevWeek}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-green-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="hidden sm:inline">Poprzedni tydzien</span>
        </button>

        <span className="text-sm font-semibold text-gray-900">
          {formatDateShort(weekStart)} - {formatDateShort(weekEnd)}.
          {weekEnd.getFullYear()}
        </span>

        <button
          onClick={goToNextWeek}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-green-600"
        >
          <span className="hidden sm:inline">Nastepny tydzien</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Shopping list link */}
      <div className="mb-4">
        <Link
          href={`/zakupy?start=${startStr}&end=${endStr}`}
          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          Generuj liste zakupow
        </Link>
      </div>

      {/* Weekly calendar */}
      <WeekView weekStart={weekStart} />

      {/* Meal ideas */}
      <MealIdeasPanel />
    </div>
  )
}

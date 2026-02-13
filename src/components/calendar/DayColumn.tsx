'use client'

import { MealSlot } from './MealSlot'

const DAY_NAMES = [
  'Niedziela',
  'Poniedzialek',
  'Wtorek',
  'Sroda',
  'Czwartek',
  'Piatek',
  'Sobota',
]

const MEAL_TYPES = [
  'SNIADANIE',
  'DRUGIE_SNIADANIE',
  'OBIAD',
  'KOLACJA',
  'PRZEKASKA',
]

interface MealPlanEntry {
  id: string
  date: string | Date
  mealType: string
  recipe: {
    name: string
    prepTime: number | null
    cookTime: number | null
  }
}

interface DayColumnProps {
  date: Date
  meals: MealPlanEntry[]
  weekStartDate: string
}

function formatDate(date: Date): string {
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

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export function DayColumn({ date, meals, weekStartDate }: DayColumnProps) {
  const dayName = DAY_NAMES[date.getDay()]
  const dateStr = toDateString(date)
  const today = isToday(date)

  return (
    <div
      className={`rounded-xl border bg-white p-3 shadow-sm ${
        today ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-200'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <h3
          className={`text-sm font-semibold ${
            today ? 'text-green-700' : 'text-gray-900'
          }`}
        >
          {dayName}, {formatDate(date)}
        </h3>
        {today && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Dzis
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {MEAL_TYPES.map((mealType) => {
          const entry = meals.find((m) => m.mealType === mealType)
          return (
            <MealSlot
              key={mealType}
              mealType={mealType}
              date={dateStr}
              entry={entry}
              weekStartDate={weekStartDate}
            />
          )
        })}
      </div>
    </div>
  )
}

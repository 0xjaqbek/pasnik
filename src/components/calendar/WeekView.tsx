'use client'

import { trpc } from '@/lib/trpc/client'
import { DayColumn } from './DayColumn'

interface WeekViewProps {
  weekStart: Date
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function WeekView({ weekStart }: WeekViewProps) {
  const startDate = toDateString(weekStart)

  const { data: mealPlans, isLoading } = trpc.mealPlan.getWeek.useQuery({
    startDate,
  })

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    days.push(d)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {days.map((date) => {
        const dateStr = toDateString(date)
        const dayMeals = (mealPlans ?? []).filter((m) => {
          const mDate = new Date(m.date)
          return toDateString(mDate) === dateStr
        })

        return (
          <DayColumn
            key={dateStr}
            date={date}
            meals={dayMeals}
            weekStartDate={startDate}
          />
        )
      })}
    </div>
  )
}

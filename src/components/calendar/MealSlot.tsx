'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { RecipePicker } from './RecipePicker'

const MEAL_TYPE_LABELS: Record<string, string> = {
  SNIADANIE: 'Sniadanie',
  DRUGIE_SNIADANIE: 'II Sniadanie',
  OBIAD: 'Obiad',
  KOLACJA: 'Kolacja',
  PRZEKASKA: 'Przekaska',
}

interface MealPlanEntry {
  id: string
  mealType: string
  recipe: {
    name: string
    prepTime: number | null
    cookTime: number | null
  }
}

interface MealSlotProps {
  mealType: string
  date: string
  entry?: MealPlanEntry
  weekStartDate: string
}

export function MealSlot({ mealType, date, entry, weekStartDate }: MealSlotProps) {
  const [showPicker, setShowPicker] = useState(false)
  const utils = trpc.useUtils()

  const createMutation = trpc.mealPlan.create.useMutation({
    onSuccess: () => {
      utils.mealPlan.getWeek.invalidate({ startDate: weekStartDate })
      setShowPicker(false)
    },
  })

  const deleteMutation = trpc.mealPlan.delete.useMutation({
    onSuccess: () => {
      utils.mealPlan.getWeek.invalidate({ startDate: weekStartDate })
    },
  })

  const handleSelectRecipe = (recipeId: string) => {
    createMutation.mutate({
      date,
      mealType: mealType as 'SNIADANIE' | 'DRUGIE_SNIADANIE' | 'OBIAD' | 'KOLACJA' | 'PRZEKASKA',
      recipeId,
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (entry) {
      deleteMutation.mutate({ id: entry.id })
    }
  }

  const label = MEAL_TYPE_LABELS[mealType] || mealType

  if (entry) {
    const totalTime =
      (entry.recipe.prepTime ?? 0) + (entry.recipe.cookTime ?? 0)
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-green-700">{label}</span>
          <p className="truncate text-sm font-medium text-gray-900">
            {entry.recipe.name}
          </p>
          {totalTime > 0 && (
            <span className="text-xs text-gray-500">{totalTime} min</span>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="ml-2 shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Usun posilek"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-left transition-colors hover:border-green-300 hover:bg-green-50/50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0 text-gray-300"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="text-xs text-gray-400">{label}</span>
      </button>

      {showPicker && (
        <RecipePicker
          onSelect={handleSelectRecipe}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}

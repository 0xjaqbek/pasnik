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

const MEAL_TYPES = [
  'SNIADANIE',
  'DRUGIE_SNIADANIE',
  'OBIAD',
  'KOLACJA',
  'PRZEKASKA',
] as const

const PRIORITY_LABELS: Record<string, { label: string; className: string }> = {
  HIGH: {
    label: 'Wysoki',
    className: 'bg-red-100 text-red-700',
  },
  MEDIUM: {
    label: 'Sredni',
    className: 'bg-yellow-100 text-yellow-700',
  },
  LOW: {
    label: 'Niski',
    className: 'bg-gray-100 text-gray-600',
  },
}

interface MoveToCalendarFormProps {
  ideaId: string
  onClose: () => void
}

function MoveToCalendarForm({ ideaId, onClose }: MoveToCalendarFormProps) {
  const [date, setDate] = useState('')
  const [mealType, setMealType] = useState<string>('OBIAD')
  const utils = trpc.useUtils()

  const moveMutation = trpc.mealIdea.moveToPlan.useMutation({
    onSuccess: () => {
      utils.mealIdea.list.invalidate()
      utils.mealPlan.getWeek.invalidate()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return
    moveMutation.mutate({
      id: ideaId,
      date,
      mealType: mealType as 'SNIADANIE' | 'DRUGIE_SNIADANIE' | 'OBIAD' | 'KOLACJA' | 'PRZEKASKA',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-gray-500">Data</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-gray-500">Posilek</label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        >
          {MEAL_TYPES.map((mt) => (
            <option key={mt} value={mt}>
              {MEAL_TYPE_LABELS[mt]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-1">
        <button
          type="submit"
          disabled={moveMutation.isPending || !date}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          Dodaj
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
        >
          Anuluj
        </button>
      </div>
    </form>
  )
}

export function MealIdeasPanel() {
  const [showPicker, setShowPicker] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: ideas, isLoading } = trpc.mealIdea.list.useQuery()
  const utils = trpc.useUtils()

  const createMutation = trpc.mealIdea.create.useMutation({
    onSuccess: () => {
      utils.mealIdea.list.invalidate()
      setShowPicker(false)
    },
  })

  const deleteMutation = trpc.mealIdea.delete.useMutation({
    onSuccess: () => {
      utils.mealIdea.list.invalidate()
    },
  })

  const handleAddIdea = (recipeId: string) => {
    createMutation.mutate({ recipeId })
  }

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunac ten pomysl?')) {
      deleteMutation.mutate({ id })
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Pomysly na posilki
        </h2>
        <button
          onClick={() => setShowPicker(true)}
          className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1.5 h-4 w-4"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Dodaj pomysl
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : ideas && ideas.length > 0 ? (
        <div className="space-y-2">
          {ideas.map((idea) => {
            const priority = PRIORITY_LABELS[idea.priority] ?? PRIORITY_LABELS.MEDIUM
            return (
              <div
                key={idea.id}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900">
                        {idea.recipe.name}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${priority.className}`}
                      >
                        {priority.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === idea.id ? null : idea.id
                        )
                      }
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                    >
                      Do kalendarza
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label="Usun pomysl"
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
                </div>
                {expandedId === idea.id && (
                  <MoveToCalendarForm
                    ideaId={idea.id}
                    onClose={() => setExpandedId(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
          <p className="text-sm text-gray-500">
            Brak pomyslow — dodaj swoje ulubione przepisy!
          </p>
        </div>
      )}

      {showPicker && (
        <RecipePicker
          onSelect={handleAddIdea}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

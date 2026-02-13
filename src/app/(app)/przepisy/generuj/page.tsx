'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

const mealTypeOptions = [
  { label: 'Dowolny', value: '' },
  { label: 'Sniadanie', value: 'breakfast' },
  { label: 'Obiad', value: 'lunch' },
  { label: 'Kolacja', value: 'dinner' },
  { label: 'Przekaska', value: 'snack' },
]

interface GeneratedRecipe {
  name: string
  description?: string
  instructions: string
  servings: number
  prepTime?: number | null
  cookTime?: number | null
  ingredients: {
    name: string
    quantity?: number | null
    unit?: string | null
  }[]
}

export default function GenerujPage() {
  const router = useRouter()
  const utils = trpc.useUtils()

  const [mealType, setMealType] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [maxTime, setMaxTime] = useState<number | ''>('')
  const [result, setResult] = useState<GeneratedRecipe | null>(null)

  const generateMutation = trpc.recipe.generate.useMutation({
    onSuccess: (data) => {
      setResult(data as GeneratedRecipe)
    },
  })

  const saveMutation = trpc.recipe.saveGenerated.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate()
      router.push('/przepisy')
    },
  })

  const handleGenerate = () => {
    setResult(null)
    generateMutation.mutate({
      mealType: mealType || undefined,
      cuisine: cuisine.trim() || undefined,
      maxTime: maxTime === '' ? undefined : maxTime,
    })
  }

  const handleSave = () => {
    if (!result) return
    saveMutation.mutate({
      name: result.name,
      description: result.description,
      instructions: result.instructions,
      servings: result.servings,
      prepTime: result.prepTime ?? null,
      cookTime: result.cookTime ?? null,
      ingredients: result.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
      })),
    })
  }

  const handleGenerateAnother = () => {
    setResult(null)
    handleGenerate()
  }

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500'

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/przepisy"
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          aria-label="Wstecz"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Generuj przepis z AI</h1>
      </div>

      {/* Preferences form */}
      {!result && (
        <div className="space-y-4">
          <div>
            <label htmlFor="mealType" className="mb-1 block text-sm font-medium text-gray-700">
              Typ posilku
            </label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className={inputClass}
            >
              {mealTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cuisine" className="mb-1 block text-sm font-medium text-gray-700">
              Kuchnia (opcjonalnie)
            </label>
            <input
              id="cuisine"
              type="text"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className={inputClass}
              placeholder="np. wloska, polska, azjatycka"
            />
          </div>

          <div>
            <label htmlFor="maxTime" className="mb-1 block text-sm font-medium text-gray-700">
              Maks. czas (min, opcjonalnie)
            </label>
            <input
              id="maxTime"
              type="number"
              min="1"
              value={maxTime}
              onChange={(e) =>
                setMaxTime(e.target.value === '' ? '' : parseInt(e.target.value) || 0)
              }
              className={inputClass}
              placeholder="np. 30"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {generateMutation.isPending ? 'Generuje przepis...' : 'Generuj'}
          </button>
        </div>
      )}

      {/* Loading state */}
      {generateMutation.isPending && (
        <div className="flex flex-col items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
          <p className="mt-3 text-sm text-gray-500">Generuje przepis...</p>
        </div>
      )}

      {/* Error */}
      {generateMutation.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{generateMutation.error.message}</p>
        </div>
      )}

      {/* Result */}
      {result && !generateMutation.isPending && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-900">{result.name}</h2>
            {result.description && (
              <p className="mt-1 text-sm text-gray-600">{result.description}</p>
            )}

            {/* Meta */}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
              {result.prepTime != null && result.prepTime > 0 && (
                <span>Przygotowanie: {result.prepTime} min</span>
              )}
              {result.cookTime != null && result.cookTime > 0 && (
                <span>Gotowanie: {result.cookTime} min</span>
              )}
              <span>Porcje: {result.servings}</span>
            </div>

            {/* Ingredients */}
            <h3 className="mt-4 text-sm font-semibold text-gray-900">Skladniki</h3>
            <ul className="mt-2 space-y-1">
              {result.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-gray-700">
                  - {ing.name}
                  {ing.quantity != null && ` (${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''})`}
                </li>
              ))}
            </ul>

            {/* Instructions */}
            <h3 className="mt-4 text-sm font-semibold text-gray-900">Instrukcje</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {result.instructions}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz do moich przepisow'}
            </button>
            <button
              onClick={handleGenerateAnother}
              disabled={generateMutation.isPending}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Generuj inny
            </button>
          </div>

          {saveMutation.error && (
            <p className="text-sm text-red-600">{saveMutation.error.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

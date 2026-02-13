'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

interface RecipePickerProps {
  onSelect: (recipeId: string) => void
  onClose: () => void
}

export function RecipePicker({ onSelect, onClose }: RecipePickerProps) {
  const [search, setSearch] = useState('')

  const { data: recipes, isLoading } = trpc.recipe.list.useQuery({
    search: search || undefined,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[80vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Wybierz przepis
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Szukaj przepisu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          ) : recipes && recipes.length > 0 ? (
            <div className="space-y-1">
              {recipes.map((recipe) => {
                const totalTime =
                  (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)
                return (
                  <button
                    key={recipe.id}
                    onClick={() => onSelect(recipe.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-green-50"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {recipe.name}
                    </span>
                    {totalTime > 0 && (
                      <span className="ml-2 shrink-0 text-xs text-gray-400">
                        {totalTime} min
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-gray-500">
              Brak przepisow
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

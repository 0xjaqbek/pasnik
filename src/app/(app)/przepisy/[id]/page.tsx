'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

const unitLabels: Record<string, string> = {
  SZT: 'szt.',
  KG: 'kg',
  G: 'g',
  L: 'l',
  ML: 'ml',
}

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>
}

export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = use(params)
  return <RecipeDetailContent id={id} />
}

function RecipeDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const { data: recipe, isLoading } = trpc.recipe.getById.useQuery({ id })

  const deleteMutation = trpc.recipe.delete.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate()
      router.push('/przepisy')
    },
  })

  const handleDelete = () => {
    if (confirm('Czy na pewno chcesz usunac ten przepis?')) {
      deleteMutation.mutate({ id })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Przepis nie zostal znaleziony.</p>
        <Link href="/przepisy" className="mt-2 inline-block text-green-600 hover:underline">
          Wroc do przepisow
        </Link>
      </div>
    )
  }

  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)

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
        <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            recipe.source === 'AI_GENERATED'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {recipe.source === 'AI_GENERATED' ? 'AI' : 'USER'}
        </span>
      </div>

      {/* Description */}
      {recipe.description && (
        <p className="mb-4 text-sm text-gray-600">{recipe.description}</p>
      )}

      {/* Meta info */}
      <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-500">
        {recipe.prepTime != null && recipe.prepTime > 0 && (
          <span>Przygotowanie: {recipe.prepTime} min</span>
        )}
        {recipe.cookTime != null && recipe.cookTime > 0 && (
          <span>Gotowanie: {recipe.cookTime} min</span>
        )}
        {totalTime > 0 && (
          <span className="font-medium text-gray-700">Razem: {totalTime} min</span>
        )}
        <span>Porcje: {recipe.servings}</span>
      </div>

      {/* Ingredients */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Skladniki</h2>
        <div className="rounded-lg border border-gray-200 bg-white">
          <ul className="divide-y divide-gray-100">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex items-center justify-between px-4 py-2.5">
                <span className={`text-sm ${ing.optional ? 'text-gray-400' : 'text-gray-900'}`}>
                  {ing.name}
                  {ing.optional && (
                    <span className="ml-1 text-xs text-gray-400">(opcjonalnie)</span>
                  )}
                </span>
                {ing.quantity != null && (
                  <span className="text-sm text-gray-500">
                    {ing.quantity} {ing.unit ? unitLabels[ing.unit] ?? ing.unit : ''}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Instrukcje</h2>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
            {recipe.instructions}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/przepisy/${recipe.id}/edytuj`}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Edytuj
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="flex-1 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {deleteMutation.isPending ? 'Usuwanie...' : 'Usun'}
        </button>
      </div>
    </div>
  )
}

'use client'

import { use } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { RecipeForm } from '@/components/recipes/RecipeForm'

interface EdytujPrzepisPageProps {
  params: Promise<{ id: string }>
}

export default function EdytujPrzepisPage({ params }: EdytujPrzepisPageProps) {
  const { id } = use(params)
  return <EdytujPrzepisContent id={id} />
}

function EdytujPrzepisContent({ id }: { id: string }) {
  const { data: recipe, isLoading } = trpc.recipe.getById.useQuery({ id })

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

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href={`/przepisy/${recipe.id}`}
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
        <h1 className="text-2xl font-bold text-gray-900">Edytuj przepis</h1>
      </div>
      <RecipeForm
        mode="edit"
        initialData={{
          id: recipe.id,
          name: recipe.name,
          description: recipe.description ?? '',
          instructions: recipe.instructions,
          servings: recipe.servings,
          prepTime: recipe.prepTime ?? '',
          cookTime: recipe.cookTime ?? '',
          ingredients: recipe.ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity ?? '',
            unit: ing.unit ?? 'SZT',
            optional: ing.optional,
          })),
        }}
      />
    </div>
  )
}

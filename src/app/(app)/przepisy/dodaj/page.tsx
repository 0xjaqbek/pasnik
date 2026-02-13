'use client'

import Link from 'next/link'
import { RecipeForm } from '@/components/recipes/RecipeForm'

export default function DodajPrzepisPage() {
  return (
    <div className="p-4">
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
        <h1 className="text-2xl font-bold text-gray-900">Dodaj przepis</h1>
      </div>
      <RecipeForm mode="add" />
    </div>
  )
}

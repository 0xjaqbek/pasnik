'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

export default function DopasujPage() {
  const router = useRouter()
  const { data: matches, isLoading } = trpc.recipe.matchWithProducts.useQuery()

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
        <h1 className="text-2xl font-bold text-gray-900">Przepisy z twoich produktow</h1>
      </div>

      <Link
        href="/przepisy/generuj"
        className="mb-4 inline-flex items-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
      >
        Wygeneruj przepis przez AI
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : matches && matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map((match) => {
            if (!match) return null
            return (
              <div
                key={match.recipe.id}
                onClick={() => router.push(`/przepisy/${match.recipe.id}`)}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {match.recipe.name}
                  </h3>
                  <span className="ml-2 shrink-0 text-sm font-medium text-green-600">
                    {match.matchPercentage}%
                  </span>
                </div>

                {/* Match percentage bar */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${match.matchPercentage}%` }}
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {match.matchedCount} z {match.totalRequired} wymaganych skladnikow
                </p>

                {/* Missing ingredients */}
                {match.missingIngredients.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500">Brakuje:</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {match.missingIngredients.map((ing) => (
                        <span
                          key={ing}
                          className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-gray-500">Brak dopasowanych przepisow</p>
        </div>
      )}
    </div>
  )
}

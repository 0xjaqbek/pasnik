'use client'

import { trpc } from '@/lib/trpc/client'

interface ShoppingItemProps {
  item: {
    id: string
    name: string
    quantity: number | null
    unit: string | null
    checked: boolean
    source: string
    mealPlan: {
      recipe: {
        name: string
      }
    } | null
  }
}

const unitLabels: Record<string, string> = {
  SZT: 'szt.',
  KG: 'kg',
  G: 'g',
  L: 'l',
  ML: 'ml',
}

export function ShoppingItem({ item }: ShoppingItemProps) {
  const utils = trpc.useUtils()

  const toggleMutation = trpc.shoppingList.toggleChecked.useMutation({
    onSuccess: () => {
      utils.shoppingList.list.invalidate()
    },
  })

  const deleteMutation = trpc.shoppingList.delete.useMutation({
    onSuccess: () => {
      utils.shoppingList.list.invalidate()
    },
  })

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
      <button
        onClick={() => toggleMutation.mutate({ id: item.id })}
        disabled={toggleMutation.isPending}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
          item.checked
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-gray-300 hover:border-green-400'
        }`}
      >
        {item.checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              item.checked ? 'text-gray-400 line-through' : 'text-gray-900'
            }`}
          >
            {item.name}
          </span>
          {item.quantity != null && (
            <span className="text-xs text-gray-500">
              {item.quantity}
              {item.unit ? ` ${unitLabels[item.unit] ?? item.unit}` : ''}
            </span>
          )}
        </div>
        {item.source === 'AUTO_GENERATED' && item.mealPlan?.recipe?.name && (
          <span className="mt-0.5 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
            z planu: {item.mealPlan.recipe.name}
          </span>
        )}
      </div>

      <button
        onClick={() => deleteMutation.mutate({ id: item.id })}
        disabled={deleteMutation.isPending}
        className="flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-red-500"
        aria-label="Usun"
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

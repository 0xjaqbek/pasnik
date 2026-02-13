'use client'

import { trpc } from '@/lib/trpc/client'
import { ShoppingItem } from './ShoppingItem'
import { AddToInventory } from './AddToInventory'

const categoryLabels: Record<string, string> = {
  NABIAL: 'Nabial',
  MIESO: 'Mieso',
  WARZYWA: 'Warzywa',
  OWOCE: 'Owoce',
  PIECZYWO: 'Pieczywo',
  SUCHE: 'Produkty suche',
  MROZONKI: 'Mrozonki',
  NAPOJE: 'Napoje',
  INNE: 'Inne',
}

export function ShoppingList() {
  const { data: items, isLoading } = trpc.shoppingList.list.useQuery()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">
          Lista zakupow jest pusta. Dodaj produkty recznie lub wygeneruj z
          planu posilkow.
        </p>
      </div>
    )
  }

  // Group items by category
  const grouped = new Map<string, typeof items>()
  for (const item of items) {
    const key = item.category ?? 'UNCATEGORIZED'
    const group = grouped.get(key) ?? []
    group.push(item)
    grouped.set(key, group)
  }

  // Sort categories: named categories first, then uncategorized
  const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
    if (a === 'UNCATEGORIZED') return 1
    if (b === 'UNCATEGORIZED') return -1
    return (categoryLabels[a] ?? a).localeCompare(categoryLabels[b] ?? b)
  })

  const checkedItems = items
    .filter((item) => item.checked)
    .map((item) => ({ id: item.id, name: item.name }))

  return (
    <>
      <div className="space-y-4 pb-24">
        {sortedKeys.map((key) => {
          const groupItems = grouped.get(key)!
          const label =
            key === 'UNCATEGORIZED' ? 'Inne' : categoryLabels[key] ?? key

          return (
            <div key={key}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {label}
              </h3>
              <div className="space-y-1.5">
                {groupItems.map((item) => (
                  <ShoppingItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <AddToInventory checkedItems={checkedItems} />
    </>
  )
}

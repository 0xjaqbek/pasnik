'use client'

import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { ExpiryBadge } from './ExpiryBadge'
import type { ProductCategory, ProductUnit } from '@/generated/prisma/enums'

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

const unitLabels: Record<string, string> = {
  SZT: 'szt.',
  KG: 'kg',
  G: 'g',
  L: 'l',
  ML: 'ml',
}

interface Product {
  id: string
  name: string
  category: ProductCategory
  location: string
  quantity: number
  unit: ProductUnit
  expiryDate: Date | string | null
  note: string | null
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate()
    },
  })

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Czy na pewno chcesz usunac ten produkt?')) {
      deleteMutation.mutate({ id: product.id })
    }
  }

  const handleClick = () => {
    router.push(`/produkty/${product.id}/edytuj`)
  }

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {product.quantity} {unitLabels[product.unit] ?? product.unit}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {categoryLabels[product.category] ?? product.category}
            </span>
            <ExpiryBadge expiryDate={product.expiryDate} />
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="ml-2 shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Usun produkt"
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
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

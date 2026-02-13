'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { ProductCard } from './ProductCard'
import type { ProductCategory, ProductLocation } from '@/generated/prisma/enums'

const locationTabs: { label: string; value: ProductLocation | undefined }[] = [
  { label: 'Wszystko', value: undefined },
  { label: 'Lodowka', value: 'LODOWKA' },
  { label: 'Spizarnia', value: 'SPIZARNIA' },
  { label: 'Zamrazarka', value: 'ZAMRAZARKA' },
]

const categoryOptions: { label: string; value: ProductCategory | '' }[] = [
  { label: 'Wszystkie kategorie', value: '' },
  { label: 'Nabial', value: 'NABIAL' },
  { label: 'Mieso', value: 'MIESO' },
  { label: 'Warzywa', value: 'WARZYWA' },
  { label: 'Owoce', value: 'OWOCE' },
  { label: 'Pieczywo', value: 'PIECZYWO' },
  { label: 'Produkty suche', value: 'SUCHE' },
  { label: 'Mrozonki', value: 'MROZONKI' },
  { label: 'Napoje', value: 'NAPOJE' },
  { label: 'Inne', value: 'INNE' },
]

export function ProductList() {
  const [location, setLocation] = useState<ProductLocation | undefined>(undefined)
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [search, setSearch] = useState('')

  const { data: products, isLoading } = trpc.product.list.useQuery({
    location,
    category: category || undefined,
    search: search || undefined,
  })

  return (
    <div className="space-y-4">
      {/* Location tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
        {locationTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setLocation(tab.value)}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              location === tab.value
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and category filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
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
            placeholder="Szukaj produktu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory | '')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Product list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-gray-500">Brak produktow — dodaj pierwszy!</p>
        </div>
      )}
    </div>
  )
}

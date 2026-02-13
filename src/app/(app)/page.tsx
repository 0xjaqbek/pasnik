'use client'

import Link from 'next/link'
import { ProductList } from '@/components/products/ProductList'

export default function SpizarniaPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900">Spizarnia</h1>
      <div className="mt-4">
        <ProductList />
      </div>

      {/* Floating add button */}
      <Link
        href="/produkty/dodaj"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-colors hover:bg-green-700"
        aria-label="Dodaj produkt"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </div>
  )
}

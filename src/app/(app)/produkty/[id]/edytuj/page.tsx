'use client'

import { use } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { ProductForm } from '@/components/products/ProductForm'

interface EdytujProduktPageProps {
  params: Promise<{ id: string }>
}

export default function EdytujProduktPage({ params }: EdytujProduktPageProps) {
  const { id } = use(params)

  return <EdytujProduktContent id={id} />
}

function EdytujProduktContent({ id }: { id: string }) {
  const { data: products, isLoading } = trpc.product.list.useQuery({})

  const product = products?.find((p) => p.id === id)

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Produkt nie zostal znaleziony.</p>
        <Link href="/" className="mt-2 inline-block text-green-600 hover:underline">
          Wroc do spizarni
        </Link>
      </div>
    )
  }

  const expiryDateStr = product.expiryDate
    ? new Date(product.expiryDate).toISOString().split('T')[0]
    : ''

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/"
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
        <h1 className="text-2xl font-bold text-gray-900">Edytuj produkt</h1>
      </div>
      <ProductForm
        mode="edit"
        initialData={{
          id: product.id,
          name: product.name,
          category: product.category,
          location: product.location,
          quantity: product.quantity,
          unit: product.unit,
          expiryDate: expiryDateStr,
          note: product.note ?? '',
        }}
      />
    </div>
  )
}

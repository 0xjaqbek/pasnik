'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { ProductCategory, ProductUnit } from '@/generated/prisma/enums'

const categoryOptions: { label: string; value: ProductCategory | '' }[] = [
  { label: 'Bez kategorii', value: '' },
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

const unitOptions: { label: string; value: ProductUnit | '' }[] = [
  { label: 'Brak', value: '' },
  { label: 'szt.', value: 'SZT' },
  { label: 'kg', value: 'KG' },
  { label: 'g', value: 'G' },
  { label: 'l', value: 'L' },
  { label: 'ml', value: 'ML' },
]

interface AddManualFormProps {
  onClose: () => void
}

export function AddManualForm({ onClose }: AddManualFormProps) {
  const utils = trpc.useUtils()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<ProductUnit | ''>('')
  const [category, setCategory] = useState<ProductCategory | ''>('')

  const mutation = trpc.shoppingList.addManual.useMutation({
    onSuccess: () => {
      utils.shoppingList.list.invalidate()
      setName('')
      setQuantity('')
      setUnit('')
      setCategory('')
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    mutation.mutate({
      name: name.trim(),
      quantity: quantity ? parseFloat(quantity) : undefined,
      unit: unit || undefined,
      category: category || undefined,
    })
  }

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm"
    >
      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nazwa produktu"
          className={inputClass}
          autoFocus
        />

        <div className="flex gap-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Ilosc"
            min="0.01"
            step="any"
            className={`${inputClass} w-24`}
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as ProductUnit | '')}
            className={`${inputClass} w-24`}
          >
            {unitOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory | '')}
            className={`${inputClass} flex-1`}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {mutation.error && (
          <p className="text-xs text-red-600">{mutation.error.message}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Dodawanie...' : 'Dodaj'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Anuluj
          </button>
        </div>
      </div>
    </form>
  )
}

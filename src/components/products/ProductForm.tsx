'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import type {
  ProductCategory,
  ProductLocation,
  ProductUnit,
} from '@/generated/prisma/enums'

const categoryOptions: { label: string; value: ProductCategory }[] = [
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

const locationOptions: { label: string; value: ProductLocation }[] = [
  { label: 'Lodowka', value: 'LODOWKA' },
  { label: 'Spizarnia', value: 'SPIZARNIA' },
  { label: 'Zamrazarka', value: 'ZAMRAZARKA' },
]

const unitOptions: { label: string; value: ProductUnit }[] = [
  { label: 'szt.', value: 'SZT' },
  { label: 'kg', value: 'KG' },
  { label: 'g', value: 'G' },
  { label: 'l', value: 'L' },
  { label: 'ml', value: 'ML' },
]

interface ProductFormData {
  id?: string
  name: string
  category: ProductCategory
  location: ProductLocation
  quantity: number
  unit: ProductUnit
  expiryDate: string
  note: string
}

interface ProductFormProps {
  mode: 'add' | 'edit'
  initialData?: ProductFormData
}

export function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter()
  const utils = trpc.useUtils()

  const [name, setName] = useState(initialData?.name ?? '')
  const [category, setCategory] = useState<ProductCategory>(
    initialData?.category ?? 'INNE'
  )
  const [location, setLocation] = useState<ProductLocation>(
    initialData?.location ?? 'LODOWKA'
  )
  const [quantity, setQuantity] = useState(initialData?.quantity ?? 1)
  const [unit, setUnit] = useState<ProductUnit>(initialData?.unit ?? 'SZT')
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate ?? '')
  const [note, setNote] = useState(initialData?.note ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate()
      router.push('/')
    },
  })

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate()
      router.push('/')
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) {
      newErrors.name = 'Nazwa jest wymagana'
    }
    if (quantity <= 0) {
      newErrors.quantity = 'Ilosc musi byc wieksza od 0'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const data = {
      name: name.trim(),
      category,
      location,
      quantity,
      unit,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      note: note.trim() || undefined,
    }

    if (mode === 'edit' && initialData?.id) {
      updateMutation.mutate({ id: initialData.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
          Nazwa
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="np. Mleko"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
          Kategoria
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
          className={inputClass}
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
          Lokalizacja
        </label>
        <select
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value as ProductLocation)}
          className={inputClass}
        >
          {locationOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity + Unit */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-gray-700">
            Ilosc
          </label>
          <input
            id="quantity"
            type="number"
            min="0.01"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
          {errors.quantity && (
            <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
          )}
        </div>
        <div className="w-28">
          <label htmlFor="unit" className="mb-1 block text-sm font-medium text-gray-700">
            Jednostka
          </label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as ProductUnit)}
            className={inputClass}
          >
            {unitOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expiry Date */}
      <div>
        <label htmlFor="expiryDate" className="mb-1 block text-sm font-medium text-gray-700">
          Data waznosci
        </label>
        <input
          id="expiryDate"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Note */}
      <div>
        <label htmlFor="note" className="mb-1 block text-sm font-medium text-gray-700">
          Notatka
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Opcjonalna notatka..."
        />
      </div>

      {/* Error from server */}
      {(createMutation.error || updateMutation.error) && (
        <p className="text-sm text-red-600">
          {createMutation.error?.message || updateMutation.error?.message}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
      >
        {isPending
          ? 'Zapisywanie...'
          : mode === 'add'
            ? 'Dodaj produkt'
            : 'Zapisz zmiany'}
      </button>
    </form>
  )
}

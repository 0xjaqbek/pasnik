'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { ProductLocation } from '@/generated/prisma/enums'

interface CheckedItem {
  id: string
  name: string
}

interface AddToInventoryProps {
  checkedItems: CheckedItem[]
}

const locationOptions: { label: string; value: ProductLocation }[] = [
  { label: 'Lodowka', value: 'LODOWKA' },
  { label: 'Spizarnia', value: 'SPIZARNIA' },
  { label: 'Zamrazarka', value: 'ZAMRAZARKA' },
]

export function AddToInventory({ checkedItems }: AddToInventoryProps) {
  const utils = trpc.useUtils()
  const [showForm, setShowForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [itemSettings, setItemSettings] = useState<
    Record<string, { location: ProductLocation; expiryDate: string }>
  >({})

  const mutation = trpc.shoppingList.addToInventory.useMutation({
    onSuccess: (data) => {
      utils.shoppingList.list.invalidate()
      utils.product.list.invalidate()
      setSuccessMessage(`Dodano ${data.length} produktow do spizarni`)
      setShowForm(false)
      setTimeout(() => setSuccessMessage(''), 3000)
    },
  })

  const getSettings = (id: string) =>
    itemSettings[id] ?? { location: 'LODOWKA' as ProductLocation, expiryDate: '' }

  const updateSetting = (
    id: string,
    field: 'location' | 'expiryDate',
    value: string
  ) => {
    setItemSettings((prev) => ({
      ...prev,
      [id]: {
        ...getSettings(id),
        [field]: value,
      },
    }))
  }

  const handleSubmit = () => {
    const items = checkedItems.map((item) => {
      const settings = getSettings(item.id)
      return {
        shoppingListItemId: item.id,
        location: settings.location,
        expiryDate: settings.expiryDate
          ? new Date(settings.expiryDate)
          : undefined,
      }
    })
    mutation.mutate({ items })
  }

  if (checkedItems.length === 0) return null

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500'

  return (
    <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-gray-200 bg-white px-4 py-3 shadow-lg">
      {successMessage && (
        <p className="mb-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      {mutation.error && (
        <p className="mb-2 text-xs text-red-600">{mutation.error.message}</p>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Dodaj do spizarni ({checkedItems.length})
        </button>
      ) : (
        <div className="space-y-3">
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {checkedItems.map((item) => {
              const settings = getSettings(item.id)
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                    {item.name}
                  </span>
                  <select
                    value={settings.location}
                    onChange={(e) =>
                      updateSetting(item.id, 'location', e.target.value)
                    }
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none"
                  >
                    {locationOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={settings.expiryDate}
                    onChange={(e) =>
                      updateSetting(item.id, 'expiryDate', e.target.value)
                    }
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none"
                    placeholder="Waznosc"
                  />
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending
                ? 'Dodawanie...'
                : `Dodaj wszystko do spizarni`}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

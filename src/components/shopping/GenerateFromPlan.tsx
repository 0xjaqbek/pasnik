'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

interface GenerateFromPlanProps {
  onClose: () => void
}

export function GenerateFromPlan({ onClose }: GenerateFromPlanProps) {
  const utils = trpc.useUtils()
  const searchParams = useSearchParams()

  const [startDate, setStartDate] = useState(searchParams.get('start') ?? '')
  const [endDate, setEndDate] = useState(searchParams.get('end') ?? '')
  const [resultCount, setResultCount] = useState<number | null>(null)

  const mutation = trpc.shoppingList.generateFromPlan.useMutation({
    onSuccess: (data) => {
      setResultCount(data.count)
      utils.shoppingList.list.invalidate()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    setResultCount(null)
    mutation.mutate({ startDate, endDate })
  }

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm"
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Od
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Do
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {mutation.error && (
          <p className="text-xs text-red-600">{mutation.error.message}</p>
        )}

        {resultCount !== null && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Wygenerowano {resultCount} pozycji
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={mutation.isPending || !startDate || !endDate}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Generowanie...' : 'Generuj'}
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

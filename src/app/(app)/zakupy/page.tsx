'use client'

import { useState, Suspense } from 'react'
import { ShoppingList } from '@/components/shopping/ShoppingList'
import { AddManualForm } from '@/components/shopping/AddManualForm'
import { GenerateFromPlan } from '@/components/shopping/GenerateFromPlan'

function ZakupyContent() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900">Lista zakupow</h1>

      {/* Action bar */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setShowGenerate(false)
          }}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            showAddForm
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Dodaj recznie
        </button>
        <button
          onClick={() => {
            setShowGenerate(!showGenerate)
            setShowAddForm(false)
          }}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            showGenerate
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Generuj z planu
        </button>
      </div>

      {/* Inline forms */}
      <div className="mt-3">
        {showAddForm && (
          <AddManualForm onClose={() => setShowAddForm(false)} />
        )}
        {showGenerate && (
          <Suspense fallback={null}>
            <GenerateFromPlan onClose={() => setShowGenerate(false)} />
          </Suspense>
        )}
      </div>

      {/* Shopping list */}
      <div className="mt-4">
        <ShoppingList />
      </div>
    </div>
  )
}

export default function ZakupyPage() {
  return (
    <Suspense fallback={<div className="p-4"><h1 className="text-2xl font-bold text-gray-900">Lista zakupow</h1></div>}>
      <ZakupyContent />
    </Suspense>
  )
}

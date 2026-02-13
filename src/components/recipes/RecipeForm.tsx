'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

const unitOptions = [
  { label: 'szt.', value: 'SZT' },
  { label: 'kg', value: 'KG' },
  { label: 'g', value: 'G' },
  { label: 'l', value: 'L' },
  { label: 'ml', value: 'ML' },
]

interface IngredientRow {
  name: string
  quantity: number | ''
  unit: string
  optional: boolean
}

interface RecipeFormData {
  id?: string
  name: string
  description: string
  instructions: string
  servings: number
  prepTime: number | ''
  cookTime: number | ''
  ingredients: IngredientRow[]
}

interface RecipeFormProps {
  mode: 'add' | 'edit'
  initialData?: RecipeFormData
}

const emptyIngredient = (): IngredientRow => ({
  name: '',
  quantity: '',
  unit: 'SZT',
  optional: false,
})

export function RecipeForm({ mode, initialData }: RecipeFormProps) {
  const router = useRouter()
  const utils = trpc.useUtils()

  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [instructions, setInstructions] = useState(initialData?.instructions ?? '')
  const [servings, setServings] = useState(initialData?.servings ?? 4)
  const [prepTime, setPrepTime] = useState<number | ''>(initialData?.prepTime ?? '')
  const [cookTime, setCookTime] = useState<number | ''>(initialData?.cookTime ?? '')
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initialData?.ingredients?.length
      ? initialData.ingredients
      : [emptyIngredient()]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = trpc.recipe.create.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate()
      router.push('/przepisy')
    },
  })

  const updateMutation = trpc.recipe.update.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate()
      router.push('/przepisy')
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const updateIngredient = (index: number, field: keyof IngredientRow, value: unknown) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    )
  }

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const addIngredient = () => {
    setIngredients((prev) => [...prev, emptyIngredient()])
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Nazwa jest wymagana'
    if (!instructions.trim()) newErrors.instructions = 'Instrukcje sa wymagane'
    if (servings <= 0) newErrors.servings = 'Liczba porcji musi byc wieksza od 0'

    const validIngredients = ingredients.filter((ing) => ing.name.trim())
    if (validIngredients.length === 0) {
      newErrors.ingredients = 'Dodaj przynajmniej 1 skladnik'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const validIngredients = ingredients
      .filter((ing) => ing.name.trim())
      .map((ing) => ({
        name: ing.name.trim(),
        quantity: ing.quantity === '' ? undefined : ing.quantity,
        unit: ing.unit as 'SZT' | 'KG' | 'G' | 'L' | 'ML' | undefined,
        optional: ing.optional,
      }))

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim(),
      servings,
      prepTime: prepTime === '' ? undefined : prepTime,
      cookTime: cookTime === '' ? undefined : cookTime,
      ingredients: validIngredients,
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
          placeholder="np. Spaghetti bolognese"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          Opis (opcjonalnie)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Krotki opis przepisu..."
        />
      </div>

      {/* Servings + Prep time + Cook time */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="servings" className="mb-1 block text-sm font-medium text-gray-700">
            Porcje
          </label>
          <input
            id="servings"
            type="number"
            min="1"
            value={servings}
            onChange={(e) => setServings(parseInt(e.target.value) || 1)}
            className={inputClass}
          />
          {errors.servings && <p className="mt-1 text-xs text-red-600">{errors.servings}</p>}
        </div>
        <div>
          <label htmlFor="prepTime" className="mb-1 block text-sm font-medium text-gray-700">
            Przygotowanie (min)
          </label>
          <input
            id="prepTime"
            type="number"
            min="0"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
            className={inputClass}
            placeholder="opcjonalnie"
          />
        </div>
        <div>
          <label htmlFor="cookTime" className="mb-1 block text-sm font-medium text-gray-700">
            Gotowanie (min)
          </label>
          <input
            id="cookTime"
            type="number"
            min="0"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
            className={inputClass}
            placeholder="opcjonalnie"
          />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Skladniki</label>
        {errors.ingredients && <p className="mb-2 text-xs text-red-600">{errors.ingredients}</p>}
        <div className="space-y-2">
          {ingredients.map((ing, index) => (
            <div key={index} className="rounded-lg border border-gray-100 p-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nazwa"
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    aria-label="Usun skladnik"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Ilosc"
                  min="0"
                  step="any"
                  value={ing.quantity}
                  onChange={(e) =>
                    updateIngredient(
                      index,
                      'quantity',
                      e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                <select
                  value={ing.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  className="w-16 rounded-lg border border-gray-200 bg-white px-1 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                  {unitOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <label className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={ing.optional}
                    onChange={(e) => updateIngredient(index, 'optional', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Opc.
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 inline-flex items-center rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-green-500 hover:text-green-600"
        >
          + Dodaj skladnik
        </button>
      </div>

      {/* Instructions */}
      <div>
        <label htmlFor="instructions" className="mb-1 block text-sm font-medium text-gray-700">
          Instrukcje
        </label>
        <textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={6}
          className={inputClass}
          placeholder="Krok po kroku..."
        />
        {errors.instructions && (
          <p className="mt-1 text-xs text-red-600">{errors.instructions}</p>
        )}
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
            ? 'Dodaj przepis'
            : 'Zapisz zmiany'}
      </button>
    </form>
  )
}

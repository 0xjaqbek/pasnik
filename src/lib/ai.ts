import { z } from 'zod'

const recipeResponseSchema = z.object({
  name: z.string(),
  description: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().nullable(),
      unit: z.string().nullable(),
    })
  ),
  instructions: z.string(),
  prepTime: z.number().nullable(),
  cookTime: z.number().nullable(),
  servings: z.number(),
})

export type AIRecipeResponse = z.infer<typeof recipeResponseSchema>

export async function generateRecipe(
  products: { name: string; quantity: number; unit: string }[],
  preferences?: { mealType?: string; cuisine?: string; maxTime?: number },
  apiKey?: string
): Promise<AIRecipeResponse> {
  if (!apiKey) throw new Error('Brak klucza API')

  const productList = products
    .map((p) => `${p.name} (${p.quantity} ${p.unit})`)
    .join(', ')

  const prompt = `Mam te produkty: ${productList}.
Zaproponuj przepis${preferences?.mealType ? ` na ${preferences.mealType}` : ''}.
${preferences?.cuisine ? `Kuchnia: ${preferences.cuisine}.` : ''}
${preferences?.maxTime ? `Maksymalny czas: ${preferences.maxTime} minut.` : ''}
Użyj głównie produktów z listy.
Odpowiedz TYLKO w JSON (bez markdown): { "name": "...", "description": "...", "ingredients": [{"name": "...", "quantity": number|null, "unit": "..."|null}], "instructions": "...", "prepTime": number|null, "cookTime": number|null, "servings": number }`

  // Support both OpenAI and DeepSeek API (same format)
  const baseUrl = apiKey.startsWith('sk-')
    ? 'https://api.openai.com/v1'
    : 'https://api.deepseek.com/v1'

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: apiKey.startsWith('sk-') ? 'gpt-4o-mini' : 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  const data = await response.json()
  const content = data.choices[0].message.content
  // Strip markdown code blocks if present
  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  const parsed = JSON.parse(cleaned)
  return recipeResponseSchema.parse(parsed)
}

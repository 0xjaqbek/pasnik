import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { ProductUnit, RecipeSource } from '@/generated/prisma/enums'

const ingredientInput = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().optional(),
  unit: z.nativeEnum(ProductUnit).optional(),
  optional: z.boolean().optional(),
})

export const recipeRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        instructions: z.string().min(1),
        servings: z.number().int().positive(),
        prepTime: z.number().int().positive().optional(),
        cookTime: z.number().int().positive().optional(),
        ingredients: z.array(ingredientInput).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ingredients, ...recipeData } = input

      const recipe = await ctx.prisma.recipe.create({
        data: {
          ...recipeData,
          userId: ctx.userId,
          source: RecipeSource.USER,
          ingredients: {
            create: ingredients.map((ing) => ({
              name: ing.name,
              quantity: ing.quantity ?? null,
              unit: ing.unit ?? null,
              optional: ing.optional ?? false,
            })),
          },
        },
        include: { ingredients: true },
      })
      return recipe
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const recipes = await ctx.prisma.recipe.findMany({
        where: {
          userId: ctx.userId,
          ...(input?.search && {
            name: { contains: input.search, mode: 'insensitive' as const },
          }),
        },
        include: {
          _count: { select: { ingredients: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return recipes
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipe = await ctx.prisma.recipe.findUnique({
        where: { id: input.id },
        include: { ingredients: true },
      })

      if (!recipe || recipe.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Przepis nie został znaleziony',
        })
      }

      return recipe
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().nullish(),
        instructions: z.string().min(1).optional(),
        servings: z.number().int().positive().optional(),
        prepTime: z.number().int().positive().nullish(),
        cookTime: z.number().int().positive().nullish(),
        ingredients: z.array(ingredientInput).min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ingredients, ...data } = input

      const existing = await ctx.prisma.recipe.findUnique({ where: { id } })
      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Przepis nie został znaleziony',
        })
      }

      const recipe = await ctx.prisma.$transaction(async (tx) => {
        if (ingredients) {
          await tx.recipeIngredient.deleteMany({ where: { recipeId: id } })
        }

        return tx.recipe.update({
          where: { id },
          data: {
            ...data,
            ...(ingredients && {
              ingredients: {
                create: ingredients.map((ing) => ({
                  name: ing.name,
                  quantity: ing.quantity ?? null,
                  unit: ing.unit ?? null,
                  optional: ing.optional ?? false,
                })),
              },
            }),
          },
          include: { ingredients: true },
        })
      })

      return recipe
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.recipe.findUnique({
        where: { id: input.id },
      })
      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Przepis nie został znaleziony',
        })
      }

      await ctx.prisma.recipe.delete({ where: { id: input.id } })
      return { success: true }
    }),

  matchWithProducts: protectedProcedure.query(async ({ ctx }) => {
    const [products, recipes] = await Promise.all([
      ctx.prisma.product.findMany({
        where: { userId: ctx.userId },
        select: { name: true },
      }),
      ctx.prisma.recipe.findMany({
        where: { userId: ctx.userId },
        include: { ingredients: true },
      }),
    ])

    const productNames = products.map((p) => p.name.toLowerCase())

    const results = recipes
      .map((recipe) => {
        const requiredIngredients = recipe.ingredients.filter(
          (ing) => !ing.optional
        )
        const totalRequired = requiredIngredients.length

        if (totalRequired === 0) return null

        const missingIngredients: string[] = []
        let matchedCount = 0

        for (const ing of requiredIngredients) {
          const ingName = ing.name.toLowerCase()
          const matched = productNames.some(
            (pName) => pName.includes(ingName) || ingName.includes(pName)
          )
          if (matched) {
            matchedCount++
          } else {
            missingIngredients.push(ing.name)
          }
        }

        const matchPercentage = matchedCount / totalRequired

        if (matchPercentage < 0.8) return null

        return {
          recipe,
          matchPercentage: Math.round(matchPercentage * 100),
          matchedCount,
          totalRequired,
          missingIngredients,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b!.matchPercentage - a!.matchPercentage)

    return results
  }),

  generate: protectedProcedure
    .input(
      z
        .object({
          mealType: z.string().optional(),
          cuisine: z.string().optional(),
          maxTime: z.number().int().positive().optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const { generateRecipe } = await import('@/lib/ai')

      const products = await ctx.prisma.product.findMany({
        where: { userId: ctx.userId },
        select: { name: true, quantity: true, unit: true },
      })

      if (products.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Dodaj produkty, aby wygenerować przepis',
        })
      }

      const apiKey = process.env.OPENAI_API_KEY

      const result = await generateRecipe(
        products,
        input
          ? {
              mealType: input.mealType,
              cuisine: input.cuisine,
              maxTime: input.maxTime,
            }
          : undefined,
        apiKey
      )

      return result
    }),

  saveGenerated: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        instructions: z.string().min(1),
        servings: z.number().int().positive(),
        prepTime: z.number().int().positive().nullish(),
        cookTime: z.number().int().positive().nullish(),
        ingredients: z
          .array(
            z.object({
              name: z.string().min(1),
              quantity: z.number().positive().nullish(),
              unit: z.string().nullish(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ingredients, ...recipeData } = input

      const recipe = await ctx.prisma.recipe.create({
        data: {
          ...recipeData,
          prepTime: recipeData.prepTime ?? null,
          cookTime: recipeData.cookTime ?? null,
          userId: ctx.userId,
          source: RecipeSource.AI_GENERATED,
          ingredients: {
            create: ingredients.map((ing) => ({
              name: ing.name,
              quantity: ing.quantity ?? null,
              unit: (ing.unit as ProductUnit) ?? null,
              optional: false,
            })),
          },
        },
        include: { ingredients: true },
      })

      return recipe
    }),
})

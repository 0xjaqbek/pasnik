import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import {
  ProductCategory,
  ProductLocation,
  ProductUnit,
  ShoppingListSource,
} from '@/generated/prisma/enums'

export const shoppingListRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.prisma.shoppingListItem.findMany({
      where: { userId: ctx.userId },
      include: {
        mealPlan: {
          select: {
            recipe: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ category: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
    })
    return items
  }),

  addManual: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        quantity: z.number().positive().optional(),
        unit: z.nativeEnum(ProductUnit).optional(),
        category: z.nativeEnum(ProductCategory).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.shoppingListItem.create({
        data: {
          userId: ctx.userId,
          name: input.name,
          quantity: input.quantity,
          unit: input.unit,
          category: input.category,
          source: ShoppingListSource.MANUAL,
        },
      })
      return item
    }),

  generateFromPlan: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const start = new Date(input.startDate)
      const end = new Date(input.endDate)

      // Get all meal plans in date range with recipe ingredients
      const mealPlans = await ctx.prisma.mealPlan.findMany({
        where: {
          userId: ctx.userId,
          date: {
            gte: start,
            lte: end,
          },
        },
        include: {
          recipe: {
            include: {
              ingredients: true,
            },
          },
        },
      })

      // Get all user's products
      const products = await ctx.prisma.product.findMany({
        where: { userId: ctx.userId },
        select: { name: true },
      })

      const productNames = products.map((p) => p.name.toLowerCase())

      // Aggregate ingredients, checking against existing products
      const aggregated = new Map<
        string,
        {
          name: string
          quantity: number
          unit: ProductUnit | null
          mealPlanIds: string[]
        }
      >()

      for (const plan of mealPlans) {
        for (const ingredient of plan.recipe.ingredients) {
          const ingNameLower = ingredient.name.toLowerCase()

          // Check if product with matching name exists (case-insensitive)
          const hasProduct = productNames.some(
            (pName) => pName === ingNameLower
          )
          if (hasProduct) continue

          const key = ingNameLower
          const existing = aggregated.get(key)

          if (existing) {
            if (ingredient.quantity) {
              existing.quantity += ingredient.quantity
            }
            if (!existing.mealPlanIds.includes(plan.id)) {
              existing.mealPlanIds.push(plan.id)
            }
          } else {
            aggregated.set(key, {
              name: ingredient.name,
              quantity: ingredient.quantity ?? 0,
              unit: ingredient.unit,
              mealPlanIds: [plan.id],
            })
          }
        }
      }

      // Clear existing AUTO_GENERATED items for this date range
      const existingAutoItems = await ctx.prisma.shoppingListItem.findMany({
        where: {
          userId: ctx.userId,
          source: ShoppingListSource.AUTO_GENERATED,
          mealPlan: {
            date: {
              gte: start,
              lte: end,
            },
          },
        },
        select: { id: true },
      })

      if (existingAutoItems.length > 0) {
        await ctx.prisma.shoppingListItem.deleteMany({
          where: {
            id: { in: existingAutoItems.map((item) => item.id) },
          },
        })
      }

      // Create new shopping list items
      const itemsToCreate = Array.from(aggregated.values()).map((item) => ({
        userId: ctx.userId,
        name: item.name,
        quantity: item.quantity > 0 ? item.quantity : null,
        unit: item.unit,
        source: ShoppingListSource.AUTO_GENERATED,
        mealPlanId: item.mealPlanIds[0],
      }))

      if (itemsToCreate.length > 0) {
        await ctx.prisma.shoppingListItem.createMany({
          data: itemsToCreate,
        })
      }

      return { count: itemsToCreate.length }
    }),

  toggleChecked: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.shoppingListItem.findUnique({
        where: { id: input.id },
      })
      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Element listy zakupów nie został znaleziony',
        })
      }

      const item = await ctx.prisma.shoppingListItem.update({
        where: { id: input.id },
        data: { checked: !existing.checked },
      })
      return item
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.shoppingListItem.findUnique({
        where: { id: input.id },
      })
      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Element listy zakupów nie został znaleziony',
        })
      }

      await ctx.prisma.shoppingListItem.delete({ where: { id: input.id } })
      return { success: true }
    }),

  addToInventory: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            shoppingListItemId: z.string(),
            expiryDate: z.date().optional(),
            location: z.nativeEnum(ProductLocation),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.$transaction(async (tx) => {
        const createdProducts = []

        for (const item of input.items) {
          const shoppingItem = await tx.shoppingListItem.findUnique({
            where: { id: item.shoppingListItemId },
          })

          if (!shoppingItem || shoppingItem.userId !== ctx.userId) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Element listy zakupów nie został znaleziony',
            })
          }

          const product = await tx.product.create({
            data: {
              userId: ctx.userId,
              name: shoppingItem.name,
              quantity: shoppingItem.quantity ?? 1,
              unit: shoppingItem.unit ?? 'SZT',
              category: shoppingItem.category ?? 'INNE',
              location: item.location,
              expiryDate: item.expiryDate,
            },
          })

          await tx.shoppingListItem.delete({
            where: { id: item.shoppingListItemId },
          })

          createdProducts.push(product)
        }

        return createdProducts
      })

      return result
    }),
})

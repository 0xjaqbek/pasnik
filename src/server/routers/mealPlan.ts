import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { MealType } from '@/generated/prisma/enums'

export const mealPlanRouter = router({
  getWeek: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)

      const mealPlans = await ctx.prisma.mealPlan.findMany({
        where: {
          userId: ctx.userId,
          date: {
            gte: start,
            lt: end,
          },
        },
        include: {
          recipe: {
            select: {
              name: true,
              prepTime: true,
              cookTime: true,
            },
          },
        },
        orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
      })

      return mealPlans
    }),

  create: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        mealType: z.nativeEnum(MealType),
        recipeId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mealPlan = await ctx.prisma.mealPlan.create({
        data: {
          userId: ctx.userId,
          date: new Date(input.date),
          mealType: input.mealType,
          recipeId: input.recipeId,
          notes: input.notes,
        },
      })
      return mealPlan
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.string().optional(),
        mealType: z.nativeEnum(MealType).optional(),
        recipeId: z.string().optional(),
        notes: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date, ...data } = input

      const existing = await ctx.prisma.mealPlan.findUnique({ where: { id } })
      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan posiłku nie został znaleziony',
        })
      }

      const mealPlan = await ctx.prisma.mealPlan.update({
        where: { id },
        data: {
          ...data,
          ...(date && { date: new Date(date) }),
        },
      })
      return mealPlan
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.mealPlan.findUnique({
        where: { id: input.id },
      })
      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan posiłku nie został znaleziony',
        })
      }

      await ctx.prisma.mealPlan.delete({ where: { id: input.id } })
      return { success: true }
    }),
})

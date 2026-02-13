import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { MealIdeaPriority, MealType } from '@/generated/prisma/enums'

export const mealIdeaRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const ideas = await ctx.prisma.mealIdea.findMany({
      where: { userId: ctx.userId },
      include: {
        recipe: {
          select: {
            name: true,
            prepTime: true,
            cookTime: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { addedAt: 'asc' }],
    })
    return ideas
  }),

  create: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        priority: z.nativeEnum(MealIdeaPriority).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const idea = await ctx.prisma.mealIdea.create({
        data: {
          userId: ctx.userId,
          recipeId: input.recipeId,
          priority: input.priority ?? MealIdeaPriority.MEDIUM,
        },
      })
      return idea
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.mealIdea.findUnique({
        where: { id: input.id },
      })
      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Pomysł na posiłek nie został znaleziony',
        })
      }

      await ctx.prisma.mealIdea.delete({ where: { id: input.id } })
      return { success: true }
    }),

  moveToPlan: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.string(),
        mealType: z.nativeEnum(MealType),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const idea = await ctx.prisma.mealIdea.findUnique({
        where: { id: input.id },
      })
      if (!idea || idea.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Pomysł na posiłek nie został znaleziony',
        })
      }

      const mealPlan = await ctx.prisma.$transaction(async (tx) => {
        const plan = await tx.mealPlan.create({
          data: {
            userId: ctx.userId,
            date: new Date(input.date),
            mealType: input.mealType,
            recipeId: idea.recipeId,
          },
        })

        await tx.mealIdea.delete({ where: { id: input.id } })

        return plan
      })

      return mealPlan
    }),
})

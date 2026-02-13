import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

export const settingsRouter = router({
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    let settings = await ctx.prisma.notificationSettings.findUnique({
      where: { userId: ctx.userId },
    })

    if (!settings) {
      settings = await ctx.prisma.notificationSettings.create({
        data: { userId: ctx.userId },
      })
    }

    return settings
  }),

  updateNotifications: protectedProcedure
    .input(
      z.object({
        expiryEnabled: z.boolean().optional(),
        expiryDaysBefore: z.number().min(1).max(30).optional(),
        expiredEnabled: z.boolean().optional(),
        missingIngredientsEnabled: z.boolean().optional(),
        mealReminderEnabled: z.boolean().optional(),
        notificationHour: z.number().min(0).max(23).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let settings = await ctx.prisma.notificationSettings.findUnique({
        where: { userId: ctx.userId },
      })

      if (!settings) {
        settings = await ctx.prisma.notificationSettings.create({
          data: { userId: ctx.userId, ...input },
        })
      } else {
        settings = await ctx.prisma.notificationSettings.update({
          where: { userId: ctx.userId },
          data: input,
        })
      }

      return settings
    }),

  getApiKey: protectedProcedure.query(async () => {
    const key = process.env.AI_API_KEY ?? ''
    if (!key) return { configured: false, masked: '' }
    const masked = key.slice(0, 4) + '...' + key.slice(-4)
    return { configured: true, masked }
  }),

  updateApiKey: protectedProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // In production, store per-user. For MVP, just set env var in memory.
      process.env.AI_API_KEY = input.apiKey
      return { success: true }
    }),
})

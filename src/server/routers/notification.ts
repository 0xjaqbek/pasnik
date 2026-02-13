import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

export const notificationRouter = router({
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string().min(1),
        auth: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Upsert: if endpoint already exists for this user, update keys
      const existing = await ctx.prisma.pushSubscription.findFirst({
        where: {
          userId: ctx.userId,
          endpoint: input.endpoint,
        },
      })

      if (existing) {
        return ctx.prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: input.p256dh,
            auth: input.auth,
          },
        })
      }

      return ctx.prisma.pushSubscription.create({
        data: {
          userId: ctx.userId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        },
      })
    }),

  unsubscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.pushSubscription.findFirst({
        where: {
          userId: ctx.userId,
          endpoint: input.endpoint,
        },
      })

      if (subscription) {
        await ctx.prisma.pushSubscription.delete({
          where: { id: subscription.id },
        })
      }

      return { success: true }
    }),

  status: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.pushSubscription.count({
      where: { userId: ctx.userId },
    })
    return { subscribed: count > 0, count }
  }),
})

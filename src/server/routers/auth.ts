import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { hashPassword, verifyPassword, createToken } from '@/lib/auth'
import { TRPCError } from '@trpc/server'

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      })
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Użytkownik z tym emailem już istnieje',
        })
      }

      const passwordHash = await hashPassword(input.password)
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
        },
      })

      const token = await createToken(user.id)
      return { token, user: { id: user.id, email: user.email, name: user.name } }
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      })
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Nieprawidłowy email lub hasło',
        })
      }

      const valid = await verifyPassword(input.password, user.passwordHash)
      if (!valid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Nieprawidłowy email lub hasło',
        })
      }

      const token = await createToken(user.id)
      return { token, user: { id: user.id, email: user.email, name: user.name } }
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) return null
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, email: true, name: true },
    })
    return user
  }),
})

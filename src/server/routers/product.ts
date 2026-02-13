import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import {
  ProductCategory,
  ProductLocation,
  ProductUnit,
} from '@/generated/prisma/enums'

export const productRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.nativeEnum(ProductCategory),
        location: z.nativeEnum(ProductLocation),
        quantity: z.number().positive(),
        unit: z.nativeEnum(ProductUnit),
        expiryDate: z.date().optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.create({
        data: {
          ...input,
          userId: ctx.userId,
        },
      })
      return product
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          location: z.nativeEnum(ProductLocation).optional(),
          category: z.nativeEnum(ProductCategory).optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.prisma.product.findMany({
        where: {
          userId: ctx.userId,
          ...(input?.location && { location: input.location }),
          ...(input?.category && { category: input.category }),
          ...(input?.search && {
            name: { contains: input.search, mode: 'insensitive' as const },
          }),
        },
        orderBy: {
          expiryDate: { sort: 'asc', nulls: 'last' },
        },
      })
      return products
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        category: z.nativeEnum(ProductCategory).optional(),
        location: z.nativeEnum(ProductLocation).optional(),
        quantity: z.number().positive().optional(),
        unit: z.nativeEnum(ProductUnit).optional(),
        expiryDate: z.date().nullish(),
        note: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const existing = await ctx.prisma.product.findUnique({ where: { id } })
      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Produkt nie został znaleziony',
        })
      }

      const product = await ctx.prisma.product.update({
        where: { id },
        data,
      })
      return product
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.product.findUnique({
        where: { id: input.id },
      })
      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Produkt nie został znaleziony',
        })
      }

      await ctx.prisma.product.delete({ where: { id: input.id } })
      return { success: true }
    }),

  expiringSoon: protectedProcedure
    .input(
      z
        .object({
          days: z.number().int().positive().default(3),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 3
      const now = new Date()
      const futureDate = new Date()
      futureDate.setDate(now.getDate() + days)

      const products = await ctx.prisma.product.findMany({
        where: {
          userId: ctx.userId,
          expiryDate: {
            lte: futureDate,
          },
        },
        orderBy: {
          expiryDate: 'asc',
        },
      })
      return products
    }),
})

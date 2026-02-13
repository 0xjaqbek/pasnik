import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function createContext(opts: { headers: Headers }) {
  const token = opts.headers.get('authorization')?.replace('Bearer ', '')
  let userId: string | null = null

  if (token) {
    try {
      const payload = await verifyToken(token)
      userId = payload.userId
    } catch {
      // Invalid token — proceed as unauthenticated
    }
  }

  return {
    prisma,
    userId,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

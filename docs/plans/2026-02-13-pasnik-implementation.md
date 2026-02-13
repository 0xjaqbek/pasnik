# Paśnik Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a PWA for managing pantry/fridge inventory, meal planning, shopping lists, and AI-powered recipe generation.

**Architecture:** Next.js 14 App Router with tRPC for type-safe API, Prisma ORM with PostgreSQL (Neon), Tailwind CSS for minimal UI, Web Push API for notifications. Single-user auth with architecture ready for multi-user.

**Tech Stack:** Next.js 14+, TypeScript, tRPC, Prisma, PostgreSQL (Neon), Tailwind CSS, next-pwa, DeepSeek/OpenAI API, Vitest + Testing Library

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Next.js project

**Step 1: Create Next.js app**

Run:
```bash
cd D:/pasnik
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Next.js project created with App Router, TypeScript, Tailwind, ESLint.

**Step 2: Verify it works**

Run: `npm run dev`
Expected: App running on http://localhost:3000

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js project with TypeScript, Tailwind, App Router"
```

### Task 2: Install core dependencies

**Step 1: Install Prisma**

Run:
```bash
cd D:/pasnik
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

**Step 2: Install tRPC + dependencies**

Run:
```bash
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query superjson zod
```

**Step 3: Install auth dependencies**

Run:
```bash
npm install bcryptjs jsonwebtoken jose
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

**Step 4: Install testing dependencies**

Run:
```bash
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 5: Install PWA + push dependencies**

Run:
```bash
npm install next-pwa web-push
npm install --save-dev @types/web-push
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: install Prisma, tRPC, auth, testing, PWA dependencies"
```

### Task 3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add test script)

**Step 1: Create Vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 2: Create test setup file**

Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
```

**Step 3: Add test script to package.json**

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 4: Write a smoke test**

Create `src/test/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('Smoke test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2)
  })
})
```

**Step 5: Run test to verify setup**

Run: `npm run test:run`
Expected: 1 test PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure Vitest with React Testing Library"
```

---

## Phase 2: Database Schema

### Task 4: Define Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Write the schema**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())

  products          Product[]
  recipes           Recipe[]
  mealPlans         MealPlan[]
  mealIdeas         MealIdea[]
  shoppingListItems ShoppingListItem[]
  notificationSettings NotificationSettings?
  pushSubscriptions PushSubscription[]
}

enum ProductCategory {
  NABIAL
  MIESO
  WARZYWA
  OWOCE
  PIECZYWO
  SUCHE
  MROZONKI
  NAPOJE
  INNE
}

enum ProductLocation {
  LODOWKA
  SPIZARNIA
  ZAMRAZARKA
}

enum ProductUnit {
  SZT
  KG
  G
  L
  ML
}

model Product {
  id         String          @id @default(cuid())
  userId     String
  name       String
  category   ProductCategory
  location   ProductLocation
  quantity   Float
  unit       ProductUnit
  expiryDate DateTime?
  addedAt    DateTime        @default(now())
  note       String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiryDate])
}

enum RecipeSource {
  USER
  AI_GENERATED
}

model Recipe {
  id          String       @id @default(cuid())
  userId      String
  name        String
  description String?
  instructions String
  servings    Int
  prepTime    Int?
  cookTime    Int?
  source      RecipeSource @default(USER)
  createdAt   DateTime     @default(now())

  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  ingredients RecipeIngredient[]
  mealPlans   MealPlan[]
  mealIdeas   MealIdea[]

  @@index([userId])
}

model RecipeIngredient {
  id       String      @id @default(cuid())
  recipeId String
  name     String
  quantity Float?
  unit     ProductUnit?
  optional Boolean     @default(false)

  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([recipeId])
}

enum MealType {
  SNIADANIE
  DRUGIE_SNIADANIE
  OBIAD
  KOLACJA
  PRZEKASKA
}

model MealPlan {
  id       String   @id @default(cuid())
  userId   String
  date     DateTime @db.Date
  mealType MealType
  recipeId String
  notes    String?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  shoppingListItems ShoppingListItem[]

  @@index([userId, date])
}

enum MealIdeaPriority {
  LOW
  MEDIUM
  HIGH
}

model MealIdea {
  id       String           @id @default(cuid())
  userId   String
  recipeId String
  priority MealIdeaPriority @default(MEDIUM)
  addedAt  DateTime         @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([userId])
}

enum ShoppingListSource {
  AUTO_GENERATED
  MANUAL
}

model ShoppingListItem {
  id         String             @id @default(cuid())
  userId     String
  name       String
  quantity   Float?
  unit       ProductUnit?
  category   ProductCategory?
  checked    Boolean            @default(false)
  source     ShoppingListSource @default(MANUAL)
  mealPlanId String?

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  mealPlan MealPlan? @relation(fields: [mealPlanId], references: [id], onDelete: SetNull)

  @@index([userId])
}

model NotificationSettings {
  id                    String  @id @default(cuid())
  userId                String  @unique
  expiryEnabled         Boolean @default(true)
  expiryDaysBefore      Int     @default(2)
  expiredEnabled        Boolean @default(true)
  missingIngredientsEnabled Boolean @default(true)
  mealReminderEnabled   Boolean @default(true)
  notificationHour      Int     @default(7)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PushSubscription {
  id       String @id @default(cuid())
  userId   String
  endpoint String
  p256dh   String
  auth     String

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Step 2: Set up .env**

Create `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/pasnik?schema=public"
```

Add `.env` to `.gitignore` if not already there.

Create `.env.example`:
```
DATABASE_URL="postgresql://user:password@host:5432/pasnik?schema=public"
JWT_SECRET="your-secret-key"
OPENAI_API_KEY="your-openai-api-key"
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
```

**Step 3: Generate Prisma client**

Run: `npx prisma generate`
Expected: Prisma Client generated successfully

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: define Prisma schema with all models"
```

---

## Phase 3: tRPC Setup

### Task 5: Set up tRPC server

**Files:**
- Create: `src/server/trpc.ts`
- Create: `src/server/routers/_app.ts`
- Create: `src/server/context.ts`

**Step 1: Create tRPC initialization**

Create `src/server/trpc.ts`:
```typescript
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { type Context } from './context'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  })
})
```

**Step 2: Create context**

Create `src/server/context.ts`:
```typescript
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
```

**Step 3: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 4: Create auth utilities**

Create `src/lib/auth.ts`:
```typescript
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, secret)
  return { userId: payload.userId as string }
}
```

**Step 5: Create app router (empty for now)**

Create `src/server/routers/_app.ts`:
```typescript
import { router } from '../trpc'

export const appRouter = router({})

export type AppRouter = typeof appRouter
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: set up tRPC server with auth context and Prisma singleton"
```

### Task 6: Set up tRPC API route and client

**Files:**
- Create: `src/app/api/trpc/[trpc]/route.ts`
- Create: `src/lib/trpc/client.ts`
- Create: `src/lib/trpc/provider.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create API route handler**

Create `src/app/api/trpc/[trpc]/route.ts`:
```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/routers/_app'
import { createContext } from '@/server/context'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ headers: req.headers }),
  })

export { handler as GET, handler as POST }
```

**Step 2: Create tRPC client hooks**

Create `src/lib/trpc/client.ts`:
```typescript
import { createTRPCReact } from '@trpc/react-query'
import { type AppRouter } from '@/server/routers/_app'

export const trpc = createTRPCReact<AppRouter>()
```

**Step 3: Create tRPC provider**

Create `src/lib/trpc/provider.tsx`:
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from './client'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  return `http://localhost:${process.env.PORT ?? 3000}`
}

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('token') ?? ''
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers() {
            const token = getToken()
            return token ? { authorization: `Bearer ${token}` } : {}
          },
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

**Step 4: Wrap app layout with provider**

Modify `src/app/layout.tsx` to wrap children with `<TRPCProvider>`.

**Step 5: Verify dev server works**

Run: `npm run dev`
Expected: No errors, app loads

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: set up tRPC API route, client hooks, and provider"
```

---

## Phase 4: Auth Router

### Task 7: Implement auth tRPC router

**Files:**
- Create: `src/server/routers/auth.ts`
- Modify: `src/server/routers/_app.ts`
- Create: `src/server/routers/__tests__/auth.test.ts`

**Step 1: Write failing tests for auth**

Create `src/server/routers/__tests__/auth.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { appRouter } from '../_app'
import { createContext } from '../../context'

// NOTE: These tests require a test database connection.
// Set DATABASE_URL to a test DB in .env.test

describe('auth router', () => {
  it('should register a new user', async () => {
    const caller = appRouter.createCaller(
      await createContext({ headers: new Headers() })
    )

    const result = await caller.auth.register({
      email: `test-${Date.now()}@example.com`,
      password: 'Test1234!',
      name: 'Test User',
    })

    expect(result.token).toBeDefined()
    expect(typeof result.token).toBe('string')
  })

  it('should login with correct credentials', async () => {
    const caller = appRouter.createCaller(
      await createContext({ headers: new Headers() })
    )

    const email = `test-${Date.now()}@example.com`
    await caller.auth.register({
      email,
      password: 'Test1234!',
      name: 'Test User',
    })

    const result = await caller.auth.login({
      email,
      password: 'Test1234!',
    })

    expect(result.token).toBeDefined()
  })

  it('should reject login with wrong password', async () => {
    const caller = appRouter.createCaller(
      await createContext({ headers: new Headers() })
    )

    const email = `test-${Date.now()}@example.com`
    await caller.auth.register({
      email,
      password: 'Test1234!',
      name: 'Test User',
    })

    await expect(
      caller.auth.login({ email, password: 'wrong' })
    ).rejects.toThrow()
  })
})
```

**Step 2: Implement auth router**

Create `src/server/routers/auth.ts`:
```typescript
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
```

**Step 3: Register auth router**

Modify `src/server/routers/_app.ts`:
```typescript
import { router } from '../trpc'
import { authRouter } from './auth'

export const appRouter = router({
  auth: authRouter,
})

export type AppRouter = typeof appRouter
```

**Step 4: Run tests**

Run: `npm run test:run`
Expected: Tests pass (requires test DB)

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement auth router with register, login, me"
```

---

## Phase 5: Product Router (CRUD)

### Task 8: Implement product tRPC router

**Files:**
- Create: `src/server/routers/product.ts`
- Modify: `src/server/routers/_app.ts`

**Step 1: Write failing tests**

Create `src/server/routers/__tests__/product.test.ts` with tests for:
- `product.create` — adds product, returns it
- `product.list` — lists user's products grouped by location
- `product.update` — updates product fields
- `product.delete` — removes product
- `product.expiringSoon` — returns products near expiry

**Step 2: Implement product router**

Create `src/server/routers/product.ts` with procedures:
- `create` — protectedProcedure, validates input with Zod, creates Product
- `list` — protectedProcedure, optional filters (location, category, search), returns products sorted by expiryDate
- `update` — protectedProcedure, partial update
- `delete` — protectedProcedure, deletes by id (verify ownership)
- `expiringSoon` — protectedProcedure, input: days (default 3), returns products expiring within N days

**Step 3: Register in app router**

Add `product: productRouter` to `_app.ts`.

**Step 4: Run tests, commit**

```bash
git add -A
git commit -m "feat: implement product CRUD router"
```

---

## Phase 6: Recipe Router

### Task 9: Implement recipe tRPC router

**Files:**
- Create: `src/server/routers/recipe.ts`
- Modify: `src/server/routers/_app.ts`

**Step 1: Write failing tests** for:
- `recipe.create` — creates recipe with ingredients
- `recipe.list` — lists user's recipes
- `recipe.getById` — returns recipe with ingredients
- `recipe.update` — updates recipe and ingredients
- `recipe.delete` — removes recipe
- `recipe.matchWithProducts` — returns recipes matched against current products (≥80% ingredients)

**Step 2: Implement recipe router**

Key logic for `matchWithProducts`:
```typescript
// For each recipe, count how many ingredients the user has in products
// Return recipes where matchedCount / totalRequired >= 0.8
```

**Step 3: Register, test, commit**

```bash
git add -A
git commit -m "feat: implement recipe CRUD router with product matching"
```

### Task 10: Implement AI recipe generation

**Files:**
- Create: `src/lib/ai.ts`
- Add to: `src/server/routers/recipe.ts`

**Step 1: Create AI service**

Create `src/lib/ai.ts`:
```typescript
import { z } from 'zod'

const recipeResponseSchema = z.object({
  name: z.string(),
  description: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
  })),
  instructions: z.string(),
  prepTime: z.number().nullable(),
  cookTime: z.number().nullable(),
  servings: z.number(),
})

export type AIRecipeResponse = z.infer<typeof recipeResponseSchema>

export async function generateRecipe(
  products: { name: string; quantity: number; unit: string }[],
  preferences?: { mealType?: string; cuisine?: string; maxTime?: number },
  apiKey?: string,
): Promise<AIRecipeResponse> {
  if (!apiKey) throw new Error('Brak klucza API')

  const productList = products.map(p => `${p.name} (${p.quantity} ${p.unit})`).join(', ')

  const prompt = `Mam te produkty: ${productList}.
Zaproponuj przepis${preferences?.mealType ? ` na ${preferences.mealType}` : ''}.
${preferences?.cuisine ? `Kuchnia: ${preferences.cuisine}.` : ''}
${preferences?.maxTime ? `Maksymalny czas: ${preferences.maxTime} minut.` : ''}
Użyj głównie produktów z listy.
Odpowiedz TYLKO w JSON (bez markdown): { "name": "...", "description": "...", "ingredients": [{"name": "...", "quantity": number|null, "unit": "..."|null}], "instructions": "...", "prepTime": number|null, "cookTime": number|null, "servings": number }`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  const data = await response.json()
  const content = data.choices[0].message.content
  const parsed = JSON.parse(content)
  return recipeResponseSchema.parse(parsed)
}
```

**Step 2: Add `generate` procedure to recipe router**

```typescript
generate: protectedProcedure
  .input(z.object({
    mealType: z.string().optional(),
    cuisine: z.string().optional(),
    maxTime: z.number().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Fetch user's products
    // 2. Fetch user's API key from settings
    // 3. Call generateRecipe()
    // 4. Return generated recipe (not saved yet)
  })
```

Add `saveGenerated` procedure to save an AI recipe to user's collection.

**Step 3: Test, commit**

```bash
git add -A
git commit -m "feat: implement AI recipe generation with DeepSeek/OpenAI"
```

---

## Phase 7: Meal Planning Router

### Task 11: Implement mealPlan tRPC router

**Files:**
- Create: `src/server/routers/mealPlan.ts`
- Modify: `src/server/routers/_app.ts`

**Procedures:**
- `getWeek` — input: startDate, returns 7 days of meal plans
- `create` — assigns recipe to date + mealType
- `update` — change date, mealType, recipe, notes
- `delete` — remove meal plan entry

### Task 12: Implement mealIdea tRPC router

**Files:**
- Create: `src/server/routers/mealIdea.ts`

**Procedures:**
- `list` — all user's meal ideas with recipe info
- `create` — add recipe as idea with priority
- `delete` — remove idea
- `moveToplan` — converts idea to MealPlan entry (assigns date + mealType, deletes idea)

**Commit after each task.**

---

## Phase 8: Shopping List Router

### Task 13: Implement shoppingList tRPC router

**Files:**
- Create: `src/server/routers/shoppingList.ts`
- Modify: `src/server/routers/_app.ts`

**Procedures:**
- `list` — all items grouped by category, with source info
- `addManual` — add manual item
- `generateFromPlan` — input: dateRange, compares MealPlan recipes' ingredients vs Products, creates AUTO_GENERATED items for missing
- `toggleChecked` — toggle checked status
- `delete` — remove item
- `addToInventory` — takes checked items, creates Products from them (user provides expiryDate + location), removes from shopping list

**Key logic for `generateFromPlan`:**
```typescript
// 1. Get all MealPlans in date range with recipe ingredients
// 2. Get all user's Products
// 3. For each ingredient, check if product with matching name exists with sufficient quantity
// 4. Missing -> ShoppingListItem (AUTO_GENERATED, linked to mealPlanId)
// 5. Aggregate duplicates (sum quantities for same ingredient name)
```

**Commit:**
```bash
git add -A
git commit -m "feat: implement shopping list router with auto-generation from meal plans"
```

---

## Phase 9: UI — Layout & Navigation

### Task 14: Create app layout with bottom navigation

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/layout/BottomNav.tsx`
- Create: `src/components/layout/AppShell.tsx`

**Bottom nav tabs:**
```
Spiżarnia | Przepisy | Kalendarz | Zakupy | Ustawienia
```

Use Tailwind: fixed bottom, icons (use simple SVG or lucide-react), active tab highlight.

**Commit:**
```bash
git add -A
git commit -m "feat: create app layout with bottom navigation"
```

### Task 15: Create auth pages

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`
- Create: `src/lib/auth-context.tsx`

Auth context stores token in localStorage, provides `login()`, `logout()`, `user` state. Redirects to `/login` if unauthenticated.

**Commit:**
```bash
git add -A
git commit -m "feat: create login/register pages and auth context"
```

---

## Phase 10: UI — Spiżarnia (Products)

### Task 16: Product list page

**Files:**
- Create: `src/app/(app)/page.tsx` (home = spiżarnia)
- Create: `src/components/products/ProductList.tsx`
- Create: `src/components/products/ProductCard.tsx`
- Create: `src/components/products/ExpiryBadge.tsx`

**Features:**
- Group by location (tabs: Lodówka / Spiżarnia / Zamrażarka)
- ExpiryBadge: green (>5d), yellow (2-5d), red (<2d), black (expired)
- Search bar + category filter
- Swipe to delete (or delete button on mobile)

### Task 17: Product add/edit form

**Files:**
- Create: `src/app/(app)/produkty/dodaj/page.tsx`
- Create: `src/components/products/ProductForm.tsx`

**Fields:** name, category (select), location (select), quantity, unit (select), expiryDate (date picker), note (optional textarea)

**Commit after each task.**

---

## Phase 11: UI — Przepisy (Recipes)

### Task 18: Recipe list and detail pages

**Files:**
- Create: `src/app/(app)/przepisy/page.tsx`
- Create: `src/app/(app)/przepisy/[id]/page.tsx`
- Create: `src/components/recipes/RecipeCard.tsx`
- Create: `src/components/recipes/RecipeDetail.tsx`

### Task 19: Recipe add/edit form

**Files:**
- Create: `src/app/(app)/przepisy/dodaj/page.tsx`
- Create: `src/components/recipes/RecipeForm.tsx`

Dynamic ingredient list (add/remove rows).

### Task 20: AI recipe generation UI

**Files:**
- Create: `src/app/(app)/przepisy/generuj/page.tsx`
- Create: `src/components/recipes/GenerateRecipe.tsx`

**Flow:**
1. Show matched recipes from user's database
2. Always show "Wygeneruj przepis przez AI" button
3. Optional preferences form (meal type, cuisine, max time)
4. Loading state during API call
5. Display generated recipe with "Zapisz do moich przepisów" button

**Commit after each task.**

---

## Phase 12: UI — Kalendarz (Meal Planning)

### Task 21: Weekly calendar view

**Files:**
- Create: `src/app/(app)/kalendarz/page.tsx`
- Create: `src/components/calendar/WeekView.tsx`
- Create: `src/components/calendar/DayColumn.tsx`
- Create: `src/components/calendar/MealSlot.tsx`

**Features:**
- 7-day view with prev/next week navigation
- Rows per meal type (Śniadanie, II Śniadanie, Obiad, Kolacja, Przekąska)
- Click slot to assign recipe (opens recipe picker modal)
- Tap existing meal to edit/remove

### Task 22: Meal ideas sidebar

**Files:**
- Create: `src/components/calendar/MealIdeasPanel.tsx`

- List of MealIdea items at bottom of calendar
- "Dodaj do kalendarza" button on each idea
- Add new idea button (recipe picker)

**Commit after each task.**

---

## Phase 13: UI — Zakupy (Shopping List)

### Task 23: Shopping list page

**Files:**
- Create: `src/app/(app)/zakupy/page.tsx`
- Create: `src/components/shopping/ShoppingList.tsx`
- Create: `src/components/shopping/ShoppingItem.tsx`

**Features:**
- Items grouped by category
- Checkbox to mark as bought
- Source badge (auto/manual)
- "Generuj z planu" button → date range picker → generates list
- "Dodaj ręcznie" button
- "Dodaj do spiżarni" button for checked items → form with pre-filled data (+ expiryDate, location)

**Commit:**
```bash
git add -A
git commit -m "feat: implement shopping list UI"
```

---

## Phase 14: UI — Ustawienia (Settings)

### Task 24: Settings page

**Files:**
- Create: `src/app/(app)/ustawienia/page.tsx`
- Create: `src/components/settings/NotificationSettings.tsx`
- Create: `src/components/settings/ApiKeySettings.tsx`
- Create: `src/server/routers/settings.ts`

**Sections:**
- Profil (name, email)
- Powiadomienia (toggles per type, hour, days before expiry)
- Klucz API (input, masked display)
- Wyloguj

**Commit:**
```bash
git add -A
git commit -m "feat: implement settings page with notifications and API key config"
```

---

## Phase 15: PWA & Push Notifications

### Task 25: Configure PWA

**Files:**
- Modify: `next.config.js` (add next-pwa config)
- Create: `public/manifest.json`
- Create: `public/icons/` (app icons)

**manifest.json:**
```json
{
  "name": "Paśnik",
  "short_name": "Paśnik",
  "description": "Zarządzaj spiżarnią, planuj posiłki, redukuj marnowanie",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [...]
}
```

### Task 26: Implement push notifications

**Files:**
- Create: `src/lib/push.ts` (client-side subscription)
- Create: `src/app/api/cron/notifications/route.ts` (Vercel Cron handler)
- Create: `src/server/routers/notification.ts`
- Modify: `vercel.json` (add cron config)

**Cron job logic:**
1. Query all users with enabled notifications
2. Check expiring/expired products
3. Check tomorrow's meal plans for missing ingredients
4. Check today's meal plan for reminders
5. Send push via web-push library

**vercel.json:**
```json
{
  "crons": [{
    "path": "/api/cron/notifications",
    "schedule": "0 7 * * *"
  }]
}
```

**Commit after each task.**

---

## Phase 16: Final Polish

### Task 27: Add loading states and error handling

- Skeleton loaders for lists
- Toast notifications for actions (dodano, usunięto, etc.)
- Error boundaries
- Empty states ("Brak produktów — dodaj pierwszy!")

### Task 28: Responsive design check

- Verify all views work on mobile viewport (375px+)
- Test PWA install flow
- Test bottom nav on various screen sizes

### Task 29: Final commit and deploy preparation

```bash
git add -A
git commit -m "feat: add loading states, error handling, responsive polish"
```

---

## Dependency Order

```
Task 1-3 (scaffolding)
  → Task 4 (schema)
    → Task 5-6 (tRPC setup)
      → Task 7 (auth)
        → Task 8 (products)
        → Task 9-10 (recipes + AI)
        → Task 11-12 (meal planning)
        → Task 13 (shopping list)
      → Task 14-15 (layout + auth UI)
        → Task 16-17 (products UI)
        → Task 18-20 (recipes UI)
        → Task 21-22 (calendar UI)
        → Task 23 (shopping UI)
        → Task 24 (settings UI)
      → Task 25-26 (PWA + push)
    → Task 27-29 (polish)
```

Backend tasks (7-13) and UI layout (14-15) can run in parallel.
UI feature tasks (16-24) depend on their respective backend routers.

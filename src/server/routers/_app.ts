import { router } from '../trpc'
import { authRouter } from './auth'
import { productRouter } from './product'
import { recipeRouter } from './recipe'

export const appRouter = router({
  auth: authRouter,
  product: productRouter,
  recipe: recipeRouter,
})

export type AppRouter = typeof appRouter

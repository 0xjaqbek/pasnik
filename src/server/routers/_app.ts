import { router } from '../trpc'
import { authRouter } from './auth'
import { productRouter } from './product'
import { recipeRouter } from './recipe'
import { mealPlanRouter } from './mealPlan'
import { mealIdeaRouter } from './mealIdea'
import { shoppingListRouter } from './shoppingList'

export const appRouter = router({
  auth: authRouter,
  product: productRouter,
  recipe: recipeRouter,
  mealPlan: mealPlanRouter,
  mealIdea: mealIdeaRouter,
  shoppingList: shoppingListRouter,
})

export type AppRouter = typeof appRouter

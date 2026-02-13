import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

function getWebPush() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:admin@pasnik.app',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  }
  return webpush
}

function getMealLabel(type: string) {
  const labels: Record<string, string> = {
    SNIADANIE: 'śniadanie',
    DRUGIE_SNIADANIE: 'II śniadanie',
    OBIAD: 'obiad',
    KOLACJA: 'kolację',
    PRZEKASKA: 'przekąskę',
  }
  return labels[type] || type
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const push = getWebPush()
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const endOfTomorrow = new Date(tomorrow)
  endOfTomorrow.setHours(23, 59, 59, 999)

  // Get all users with notification settings and push subscriptions
  const users = await prisma.user.findMany({
    include: {
      notificationSettings: true,
      pushSubscriptions: true,
      products: true,
      mealPlans: {
        where: {
          date: {
            gte: today,
            lte: endOfTomorrow,
          },
        },
        include: {
          recipe: { include: { ingredients: true } },
        },
      },
    },
  })

  let sent = 0
  let errors = 0

  for (const user of users) {
    if (!user.notificationSettings || user.pushSubscriptions.length === 0) continue

    const notifications: string[] = []
    const settings = user.notificationSettings

    // 1. Expiring soon
    if (settings.expiryEnabled) {
      const threshold = new Date(today)
      threshold.setDate(threshold.getDate() + settings.expiryDaysBefore)

      const expiring = user.products.filter(
        (p) => p.expiryDate && p.expiryDate > today && p.expiryDate <= threshold
      )
      for (const p of expiring) {
        const days = Math.ceil(
          (p.expiryDate!.getTime() - today.getTime()) / 86400000
        )
        notifications.push(`${p.name} wygasa za ${days} dni`)
      }
    }

    // 2. Expired products
    if (settings.expiredEnabled) {
      const expired = user.products.filter(
        (p) => p.expiryDate && p.expiryDate < today
      )
      for (const p of expired) {
        notifications.push(`${p.name} jest przeterminowany`)
      }
    }

    // 3. Missing ingredients for tomorrow's meals
    if (settings.missingIngredientsEnabled) {
      const tomorrowMeals = user.mealPlans.filter((mp) => {
        const mpDate = new Date(mp.date)
        mpDate.setHours(0, 0, 0, 0)
        return mpDate.getTime() === tomorrow.getTime()
      })

      for (const meal of tomorrowMeals) {
        const missing = meal.recipe.ingredients.filter(
          (ing) =>
            !ing.optional &&
            !user.products.some((p) =>
              p.name.toLowerCase().includes(ing.name.toLowerCase())
            )
        )
        if (missing.length > 0) {
          notifications.push(
            `Na jutrzejszy ${getMealLabel(meal.mealType)} (${meal.recipe.name}) brakuje: ${missing.map((m) => m.name).join(', ')}`
          )
        }
      }
    }

    // 4. Today's meal reminders
    if (settings.mealReminderEnabled) {
      const todayMeals = user.mealPlans.filter((mp) => {
        const mpDate = new Date(mp.date)
        mpDate.setHours(0, 0, 0, 0)
        return mpDate.getTime() === today.getTime()
      })
      for (const meal of todayMeals) {
        notifications.push(
          `Dziś na ${getMealLabel(meal.mealType)}: ${meal.recipe.name}`
        )
      }
    }

    // Send push to all user's subscriptions
    for (const sub of user.pushSubscriptions) {
      for (const body of notifications) {
        try {
          await push.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title: 'Paśnik', body })
          )
          sent++
        } catch (error: unknown) {
          errors++
          const statusCode =
            error && typeof error === 'object' && 'statusCode' in error
              ? (error as { statusCode: number }).statusCode
              : null
          if (statusCode === 410) {
            // Subscription expired, remove it
            await prisma.pushSubscription.delete({ where: { id: sub.id } })
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent, errors })
}

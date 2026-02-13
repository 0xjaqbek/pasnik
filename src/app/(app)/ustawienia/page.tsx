'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { trpc } from '@/lib/trpc/client'
import { subscribeToPush, unsubscribeFromPush, isPushSupported } from '@/lib/push'

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-green-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function NotificationSettings() {
  const utils = trpc.useUtils()
  const { data: settings, isLoading } =
    trpc.settings.getNotifications.useQuery()

  const mutation = trpc.settings.updateNotifications.useMutation({
    onSuccess: () => {
      utils.settings.getNotifications.invalidate()
    },
  })

  const update = useCallback(
    (field: string, value: boolean | number) => {
      mutation.mutate({ [field]: value })
    },
    [mutation]
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    )
  }

  if (!settings) return null

  const toggleItems = [
    {
      label: 'Zblizajacy sie termin waznosci',
      field: 'expiryEnabled',
      value: settings.expiryEnabled,
    },
    {
      label: 'Przeterminowane produkty',
      field: 'expiredEnabled',
      value: settings.expiredEnabled,
    },
    {
      label: 'Brakujace skladniki',
      field: 'missingIngredientsEnabled',
      value: settings.missingIngredientsEnabled,
    },
    {
      label: 'Przypomnienia o posilkach',
      field: 'mealReminderEnabled',
      value: settings.mealReminderEnabled,
    },
  ]

  return (
    <div className="space-y-4">
      {toggleItems.map((item) => (
        <div
          key={item.field}
          className="flex items-center justify-between"
        >
          <span className="text-sm text-gray-700">{item.label}</span>
          <Toggle
            checked={item.value}
            onChange={(val) => update(item.field, val)}
            disabled={mutation.isPending}
          />
        </div>
      ))}

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor="expiryDays"
            className="text-sm text-gray-700"
          >
            Dni przed wygasnieciem
          </label>
          <input
            id="expiryDays"
            type="number"
            min={1}
            max={30}
            value={settings.expiryDaysBefore}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (val >= 1 && val <= 30) {
                update('expiryDaysBefore', val)
              }
            }}
            className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label
          htmlFor="notifHour"
          className="text-sm text-gray-700"
        >
          Godzina powiadomien
        </label>
        <input
          id="notifHour"
          type="number"
          min={0}
          max={23}
          value={settings.notificationHour}
          onChange={(e) => {
            const val = parseInt(e.target.value)
            if (val >= 0 && val <= 23) {
              update('notificationHour', val)
            }
          }}
          className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </div>
    </div>
  )
}

function ApiKeySection() {
  const { data: apiKeyInfo, isLoading } = trpc.settings.getApiKey.useQuery()
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const mutation = trpc.settings.updateApiKey.useMutation({
    onSuccess: () => {
      setApiKey('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const handleSave = () => {
    if (!apiKey.trim()) return
    mutation.mutate({ apiKey: apiKey.trim() })
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
      ) : apiKeyInfo?.configured ? (
        <p className="text-sm text-gray-600">
          Klucz skonfigurowany: <span className="font-mono text-gray-900">{apiKeyInfo.masked}</span>
        </p>
      ) : (
        <p className="text-sm text-gray-500">Klucz API nie jest skonfigurowany</p>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Wpisz nowy klucz API..."
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            aria-label={showKey ? 'Ukryj klucz' : 'Pokaz klucz'}
          >
            {showKey ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={mutation.isPending || !apiKey.trim()}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
        </button>
      </div>

      {saved && (
        <p className="text-sm text-green-600">Klucz API zostal zapisany</p>
      )}
      {mutation.error && (
        <p className="text-sm text-red-600">{mutation.error.message}</p>
      )}

      <p className="text-xs text-gray-400">
        Klucz API do DeepSeek lub OpenAI, wymagany do generowania przepisow
      </p>
    </div>
  )
}

function PushNotificationSection() {
  const [supported, setSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: status, isLoading: statusLoading } =
    trpc.notification.status.useQuery()

  const subscribeMutation = trpc.notification.subscribe.useMutation({
    onSuccess: () => utils.notification.status.invalidate(),
  })
  const unsubscribeMutation = trpc.notification.unsubscribe.useMutation({
    onSuccess: () => utils.notification.status.invalidate(),
  })

  useEffect(() => {
    setSupported(isPushSupported())
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      const sub = await subscribeToPush()
      await subscribeMutation.mutateAsync(sub)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Nie udalo sie wlaczyc powiadomien'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get current subscription endpoint before unsubscribing
      const registration = await navigator.serviceWorker.ready
      const currentSub = await registration.pushManager.getSubscription()
      const endpoint = currentSub?.endpoint

      await unsubscribeFromPush()

      if (endpoint) {
        await unsubscribeMutation.mutateAsync({ endpoint })
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Nie udalo sie wylaczyc powiadomien'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-gray-500">
        Powiadomienia push nie sa wspierane w tej przegladarce.
      </p>
    )
  }

  if (statusLoading) {
    return <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">
          Status:{' '}
          <span
            className={
              status?.subscribed
                ? 'font-semibold text-green-600'
                : 'text-gray-500'
            }
          >
            {status?.subscribed ? 'Wlaczone' : 'Wylaczone'}
          </span>
        </span>
        {status?.subscribed ? (
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {loading ? 'Wylaczanie...' : 'Wylacz powiadomienia'}
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Wlaczanie...' : 'Wlacz powiadomienia'}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default function UstawieniaPage() {
  const { user, logout } = useAuth()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>

      <div className="mt-6 space-y-6">
        {/* Profil */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Profil
          </h2>
          {user ? (
            <div className="space-y-1">
              <p className="text-sm text-gray-900">
                <span className="text-gray-500">Imie:</span> {user.name}
              </p>
              <p className="text-sm text-gray-900">
                <span className="text-gray-500">E-mail:</span> {user.email}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Ladowanie...</p>
          )}
        </section>

        {/* Powiadomienia */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Powiadomienia
          </h2>
          <NotificationSettings />
        </section>

        {/* Powiadomienia push */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Powiadomienia push
          </h2>
          <PushNotificationSection />
        </section>

        {/* Klucz API */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Klucz API
          </h2>
          <ApiKeySection />
        </section>

        {/* Wyloguj */}
        <section>
          <button
            onClick={logout}
            className="w-full rounded-lg border-2 border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Wyloguj sie
          </button>
        </section>
      </div>
    </div>
  )
}

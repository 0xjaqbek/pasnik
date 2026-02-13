'use client'

interface ExpiryBadgeProps {
  expiryDate: Date | string | null | undefined
}

function getDaysUntilExpiry(expiryDate: Date | string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getExpiryLabel(days: number): string {
  if (days < 0) return 'przeterminowany'
  if (days === 0) return 'dzis'
  if (days === 1) return 'jutro'
  return `za ${days} dni`
}

function getExpiryStyles(days: number): string {
  if (days < 0) return 'bg-gray-900 text-white'
  if (days < 2) return 'bg-red-100 text-red-800'
  if (days <= 5) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

export function ExpiryBadge({ expiryDate }: ExpiryBadgeProps) {
  if (!expiryDate) {
    return (
      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
        brak daty
      </span>
    )
  }

  const days = getDaysUntilExpiry(expiryDate)
  const label = getExpiryLabel(days)
  const styles = getExpiryStyles(days)

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {label}
    </span>
  )
}

import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  message: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-gray-300">{icon}</div>}
      <p className="text-sm text-gray-500">{message}</p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="mt-4 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-4 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}

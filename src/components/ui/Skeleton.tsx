interface SkeletonProps {
  variant?: 'line' | 'card' | 'circle'
  className?: string
}

const variantClasses = {
  line: 'h-4 w-full rounded',
  card: 'h-24 w-full rounded-lg',
  circle: 'h-10 w-10 rounded-full',
}

export function Skeleton({ variant = 'line', className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${variantClasses[variant]} ${className}`}
    />
  )
}

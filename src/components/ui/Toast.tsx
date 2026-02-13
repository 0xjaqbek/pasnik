'use client'

// Toast component is provided via ToastProvider in @/lib/toast-context
// Usage:
//   import { useToast } from '@/lib/toast-context'
//   const { showToast } = useToast()
//   showToast('Zapisano!', 'success')
//   showToast('Cos poszlo nie tak', 'error')
//   showToast('Informacja', 'info')

export { ToastProvider, useToast } from '@/lib/toast-context'

'use client'

import { useState, useCallback } from 'react'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastInput = Omit<Toast, 'id'>

// Global store so any component can fire toasts without prop-drilling
let listeners: Array<(toast: Toast) => void> = []
let dismissListeners: Array<(id: string) => void> = []

export function toast(input: ToastInput) {
  const id = Math.random().toString(36).slice(2)
  const t: Toast = { id, variant: 'default', ...input }
  listeners.forEach(l => l(t))
  return id
}

toast.success = (title: string, description?: string) =>
  toast({ title, description, variant: 'success' })

toast.error = (title: string, description?: string) =>
  toast({ title, description, variant: 'error' })

toast.warning = (title: string, description?: string) =>
  toast({ title, description, variant: 'warning' })

export function dismiss(id: string) {
  dismissListeners.forEach(l => l(id))
}

/** Used internally by <Toaster> to subscribe to toast events */
export function useToastStore() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const subscribe = useCallback(() => {
    const onAdd = (t: Toast) => {
      setToasts(prev => [...prev, t])
      // Auto-dismiss after 4 s
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id))
      }, 4000)
    }
    const onDismiss = (id: string) => setToasts(prev => prev.filter(x => x.id !== id))

    listeners.push(onAdd)
    dismissListeners.push(onDismiss)

    return () => {
      listeners = listeners.filter(l => l !== onAdd)
      dismissListeners = dismissListeners.filter(l => l !== onDismiss)
    }
  }, [])

  return { toasts, subscribe, dismiss }
}

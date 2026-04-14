'use client'

import { useEffect } from 'react'
import { useToastStore, dismiss } from '@/lib/use-toast'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const VARIANT_STYLES = {
  default: 'bg-slate-900 border-slate-700 text-white',
  success: 'bg-emerald-900 border-emerald-700 text-white',
  error:   'bg-red-900   border-red-700   text-white',
  warning: 'bg-amber-900 border-amber-700 text-white',
}

const VARIANT_ICONS = {
  default: <Info          className="h-4 w-4 text-slate-300 flex-shrink-0" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" />,
  error:   <AlertCircle  className="h-4 w-4 text-red-300    flex-shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-300  flex-shrink-0" />,
}

export function Toaster() {
  const { toasts, subscribe } = useToastStore()

  useEffect(() => {
    const unsub = subscribe()
    return unsub
  }, [subscribe])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map(t => {
        const variant = t.variant ?? 'default'
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl
              transition-all duration-300 animate-in slide-in-from-right-full
              ${VARIANT_STYLES[variant]}`}
          >
            {VARIANT_ICONS[variant]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs opacity-80 leading-snug">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

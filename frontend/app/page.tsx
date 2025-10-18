'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Sparkles } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Try to get current user to check if already logged in
    const checkAuth = async () => {
      try {
        await apiClient.getCurrentUser()
        router.push('/dashboard')
      } catch {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-slate-900 opacity-40" />
        <div className="absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.4),rgba(15,23,42,0))] blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.3),rgba(15,23,42,0))] blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6 text-center text-slate-100">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-[0_25px_70px_-35px_rgba(30,64,175,0.9)]">
          <div className="absolute inset-0 rounded-full border border-indigo-400/60" />
          <div className="absolute inset-3 rounded-full border border-indigo-300/50" />
          <div className="absolute h-20 w-20 animate-spin-slow rounded-full border-2 border-transparent border-t-indigo-200/80" />
          <Sparkles className="h-8 w-8 text-indigo-100" />
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/80">Preparing workspace</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Loading your scheduling experience</h1>
          <p className="max-w-xl text-sm text-slate-200/80 sm:text-base">
            We are verifying your session and warming up the duty scheduler. You will be redirected automatically in a moment.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-indigo-100/80">
          <span className="h-2 w-2 rounded-full bg-indigo-300 animate-pulse" />
          Secure authentication in progress
        </div>
      </div>
    </div>
  )
}

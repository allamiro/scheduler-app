'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'
import { CalendarDays, ShieldCheck, Share2, Sparkles } from 'lucide-react'

const features = [
  {
    title: 'Drag-and-drop rosters',
    description: 'Quickly orchestrate complex schedules with instant conflict prevention.',
    icon: CalendarDays
  },
  {
    title: 'One-click publishing',
    description: 'Share polished, print-ready schedules with secure public links.',
    icon: Share2
  },
  {
    title: 'Role aware workflows',
    description: 'Stay compliant with approvals, audit trails, and capacity safeguards.',
    icon: ShieldCheck
  }
]

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const normalizedCredentials = {
        username: credentials.username.trim(),
        password: credentials.password,
      }

      await apiClient.login(normalizedCredentials)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),rgba(15,23,42,0))]" />
        <div className="absolute left-1/2 top-[-20%] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35),rgba(15,23,42,0))] blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.22),rgba(15,23,42,0))] blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-10 text-slate-100">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-semibold uppercase tracking-widest text-indigo-100 shadow-[0_10px_40px_-20px_rgba(79,70,229,0.8)]">
              <Sparkles className="h-4 w-4" />
              Duty Scheduler
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Plan with confidence. Publish with pride.
              </h1>
              <p className="text-base text-slate-200 sm:text-lg">
                Coordinate radiology duty rosters with beautiful visuals, role-based workflows, and instant publishing. Designed to feel as polished as the Vite experience—on every screen size.
              </p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition duration-300 hover:border-indigo-400/40 hover:bg-white/10"
                >
                  <feature.icon className="mb-3 h-6 w-6 text-indigo-200 transition-transform duration-300 group-hover:scale-105" />
                  <dt className="text-base font-semibold text-white">{feature.title}</dt>
                  <dd className="mt-2 text-sm text-slate-200/80">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 animate-pulse-soft rounded-3xl bg-gradient-to-br from-indigo-500/40 via-sky-400/20 to-purple-500/30 blur-3xl" />

            <div className="relative rounded-3xl border border-white/15 bg-white/10 p-8 shadow-[0_30px_120px_-35px_rgba(30,64,175,0.8)] backdrop-blur-xl sm:p-10">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-white">Sign in</h2>
                <p className="mt-2 text-sm text-slate-200/90">
                  Use your credentials to access the scheduling workspace.
                </p>
              </div>

              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-200">
                      Username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      className="mt-2 h-11 rounded-2xl border-transparent bg-white/90 text-base font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                      placeholder="admin"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="mt-2 h-11 rounded-2xl border-transparent bg-white/90 text-base font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 py-6 text-base font-semibold text-white shadow-lg shadow-indigo-500/40 transition focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Enter workspace'}
                </Button>
              </form>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-xs text-indigo-100">
                <p className="font-semibold text-white">Quick demo accounts</p>
                <ul className="mt-3 space-y-1 text-[13px] text-slate-100/80">
                  <li><span className="font-medium text-white">Admin:</span> admin / admin</li>
                  <li><span className="font-medium text-white">Editor:</span> editor / editor</li>
                  <li><span className="font-medium text-white">Viewer:</span> viewer / viewer</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

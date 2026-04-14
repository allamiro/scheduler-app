'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PublishedSchedule } from '@/lib/types'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink, Trash2, Calendar, User, Sparkles } from 'lucide-react'
import { toast } from '@/lib/use-toast'

export default function PublishedHistoryPage() {
  const [publishedSchedules, setPublishedSchedules] = useState<PublishedSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadPublishedSchedules()
  }, [])

  const loadPublishedSchedules = async () => {
    try {
      setLoading(true)
      const schedules = await apiClient.getPublishedSchedules()
      setPublishedSchedules(schedules)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load published schedules')
    } finally {
      setLoading(false)
    }
  }

  const [unpublishingId, setUnpublishingId] = useState<number | null>(null)

  const handleUnpublish = async (scheduleId: number) => {
    // Require a second click as confirmation instead of window.confirm
    if (unpublishingId !== scheduleId) {
      setUnpublishingId(scheduleId)
      return
    }
    setUnpublishingId(null)
    try {
      await apiClient.unpublishSchedule(scheduleId)
      toast.success('Schedule unpublished', 'The schedule is now editable again')
      loadPublishedSchedules()
    } catch (err) {
      toast.error('Unpublish failed', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatWeekRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-grid-slate-900 opacity-40" />
          <div className="absolute left-1/2 top-[20%] h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35),rgba(15,23,42,0))] blur-3xl" />
          <div className="absolute bottom-[-15%] right-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.28),rgba(15,23,42,0))] blur-3xl" />
        </div>

        <div className="relative text-center text-slate-100">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <Sparkles className="h-7 w-7 text-indigo-100" />
          </div>
          <p className="mt-6 text-sm uppercase tracking-[0.35em] text-indigo-200/80">Gathering history</p>
          <p className="mt-2 text-base text-slate-200/80">Loading published schedules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pb-12">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-slate-100">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-full border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-white">Published Schedules History</h1>
          </div>
          <p className="text-indigo-100/90">
            Manage and view all published schedule versions. Unpublish schedules to allow editing.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-50">
            <p>{error}</p>
          </div>
        )}

        {/* Published Schedules List */}
        {publishedSchedules.length === 0 ? (
          <Card className="border-white/20 bg-white/10 backdrop-blur text-white">
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-indigo-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Published Schedules</h3>
              <p className="text-indigo-100/90 mb-4">
                No schedules have been published yet. Publish a schedule to see it here.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 text-white"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {publishedSchedules.map((schedule) => (
              <Card
                key={schedule.id}
                className="border-white/20 bg-white/10 text-white shadow-[0_25px_80px_-35px_rgba(30,64,175,0.6)] transition duration-300 hover:bg-white/15"
              >
                <CardHeader className="pb-0">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-white mb-2">
                        Week of {formatWeekRange(schedule.week_start_date, schedule.week_end_date)}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-indigo-100/80">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Published: {formatDate(schedule.published_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Schedule ID: {schedule.schedule_id}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-full border border-emerald-300/40 bg-emerald-400/20 text-emerald-100">
                      Published
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/p/${schedule.slug}`, '_blank')}
                      className="flex items-center gap-2 rounded-full border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Published Schedule
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUnpublish(schedule.schedule_id)}
                      className={`flex items-center gap-2 rounded-full text-white transition ${
                        unpublishingId === schedule.schedule_id
                          ? 'bg-rose-700 ring-2 ring-rose-400'
                          : 'bg-rose-500/80 hover:bg-rose-500'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                      {unpublishingId === schedule.schedule_id ? 'Confirm Unpublish?' : 'Unpublish'}
                    </Button>
                  </div>
                  <div className="mt-4 text-sm text-indigo-100/80">
                    <p>
                      <strong className="text-white">Public URL:</strong>{' '}
                      <code className="rounded-full border border-white/20 bg-white/10 px-3 py-1">/p/{schedule.slug}</code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

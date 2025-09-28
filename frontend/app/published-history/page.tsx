'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PublishedSchedule } from '@/lib/types'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink, Trash2, Calendar, User } from 'lucide-react'

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

  const handleUnpublish = async (scheduleId: number) => {
    if (!confirm('Are you sure you want to unpublish this schedule? This will remove all published versions and allow editing.')) {
      return
    }

    try {
      await apiClient.unpublishSchedule(scheduleId)
      alert('Schedule unpublished successfully!')
      loadPublishedSchedules() // Reload the list
    } catch (err) {
      alert(`Failed to unpublish schedule: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading published schedules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Published Schedules History</h1>
          </div>
          <p className="text-gray-600">
            Manage and view all published schedule versions. Unpublish schedules to allow editing.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Published Schedules List */}
        {publishedSchedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Published Schedules</h3>
              <p className="text-gray-600 mb-4">
                No schedules have been published yet. Publish a schedule to see it here.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {publishedSchedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                        Week of {formatWeekRange(schedule.week_start_date, schedule.week_end_date)}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Published: {formatDate(schedule.published_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Schedule ID: {schedule.schedule_id}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Published
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/p/${schedule.slug}`, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Published Schedule
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUnpublish(schedule.schedule_id)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Unpublish
                    </Button>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <p><strong>Public URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">/p/{schedule.slug}</code></p>
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

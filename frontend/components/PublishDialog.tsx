'use client'

import { useState } from 'react'
import { PublishedSchedule } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'
import { ExternalLink, Copy, Check } from 'lucide-react'

interface PublishDialogProps {
  scheduleId: number
  weekStart: Date
}

export function PublishDialog({ scheduleId, weekStart }: PublishDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [publishedSchedule, setPublishedSchedule] = useState<PublishedSchedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handlePublish = async () => {
    setLoading(true)
    try {
      const result = await apiClient.publishSchedule(scheduleId)
      setPublishedSchedule(result)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to publish schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!publishedSchedule) return
    
    const url = `${window.location.origin}/p/${publishedSchedule.slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      alert('Failed to copy link')
    }
  }

  const handleOpenLink = () => {
    if (!publishedSchedule) return
    window.open(`/p/${publishedSchedule.slug}`, '_blank')
  }

  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    return `${weekStart.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${weekEnd.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })}`
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Publish Schedule
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Schedule</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Publishing schedule for: <strong>{formatWeekRange(weekStart)}</strong>
            </div>
            
            <div className="text-sm text-gray-600">
              This will create a read-only, printable version of the schedule that can be shared publicly.
            </div>

            {publishedSchedule ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm text-green-800 font-medium mb-2">
                    Schedule published successfully!
                  </div>
                  <div className="text-xs text-green-600">
                    Published on: {new Date(publishedSchedule.published_at).toLocaleString()}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Public Link:</label>
                  <div className="flex space-x-2">
                    <Input
                      value={`${window.location.origin}/p/${publishedSchedule.slug}`}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="flex items-center space-x-1"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                Click "Publish" to generate a public link for this schedule.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {publishedSchedule ? 'Close' : 'Cancel'}
            </Button>
            
            {publishedSchedule ? (
              <Button onClick={handleOpenLink} className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <span>View Published</span>
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={loading}>
                {loading ? 'Publishing...' : 'Publish'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

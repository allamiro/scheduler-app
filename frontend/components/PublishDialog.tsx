'use client'

import { useState } from 'react'
import { PublishedSchedule, Schedule, AssignmentType, ASSIGNMENT_TYPES, Doctor } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'
import { ExternalLink, Copy, Check, AlertTriangle } from 'lucide-react'

interface PublishDialogProps {
  scheduleId: number
  weekStart: Date
  schedule?: Schedule | null
  preparedBy?: Doctor | null
  approvedBy?: Doctor | null
  isPublished?: boolean
  onUnpublish?: () => void
}

export function PublishDialog({ scheduleId, weekStart, schedule, preparedBy, approvedBy, isPublished = false, onUnpublish }: PublishDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [publishedSchedule, setPublishedSchedule] = useState<PublishedSchedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Validation function for weekend requirements
  const validateSchedule = () => {
    if (!schedule) return { isValid: false, message: 'No schedule data available' }

    const weekDates: Date[] = []
    const startOfWeek = new Date(weekStart)
    startOfWeek.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Start from Monday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      weekDates.push(date)
    }

    const missingAssignments: string[] = []

    weekDates.forEach((date, index) => {
      const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const dateStr = date.toISOString().split('T')[0]
      
      // For Friday (5), Saturday (6), Sunday (0) - only require Duty
      if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
        const dutyAssignments = schedule.assignments.filter(
          a => a.assignment_date === dateStr && a.assignment_type === 'DUTY'
        )
        if (dutyAssignments.length === 0) {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
          missingAssignments.push(`${dayName}: Duty assignment required`)
        }
      } else {
        // For Monday-Thursday - require all assignment types
        ASSIGNMENT_TYPES.forEach(assignmentType => {
          const assignments = schedule.assignments.filter(
            a => a.assignment_date === dateStr && a.assignment_type === assignmentType.type
          )
          if (assignments.length === 0) {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
            missingAssignments.push(`${dayName}: ${assignmentType.label} assignment required`)
          }
        })
      }
    })

    return {
      isValid: missingAssignments.length === 0,
      message: missingAssignments.length === 0 
        ? 'Schedule is ready to publish!' 
        : `Missing assignments:\n${missingAssignments.join('\n')}`
    }
  }

  const validation = validateSchedule()

  const handlePublish = async () => {
    setLoading(true)
    try {
      const result = await apiClient.publishSchedule(
        scheduleId, 
        preparedBy?.name, 
        approvedBy?.name
      )
      setPublishedSchedule(result)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to publish schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this schedule? This will remove all published versions and allow editing.')) {
      return
    }

    setLoading(true)
    try {
      await apiClient.unpublishSchedule(scheduleId)
      alert('Schedule unpublished successfully!')
      setIsOpen(false)
      if (onUnpublish) {
        onUnpublish()
      }
    } catch (error) {
      alert(`Failed to unpublish schedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      <Button onClick={() => setIsOpen(true)} variant={isPublished ? "destructive" : "default"}>
        {isPublished ? "Unpublish Schedule" : "Publish Schedule"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isPublished ? "Unpublish Schedule" : "Publish Schedule"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {isPublished ? "Unpublishing" : "Publishing"} schedule for: <strong>{formatWeekRange(weekStart)}</strong>
            </div>
            
            {/* Validation Status */}
            {!isPublished && (
              <div className={`p-3 rounded-md border ${
                validation.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className={`flex items-center space-x-2 ${
                  validation.isValid ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {validation.isValid ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {validation.isValid ? 'Ready to Publish' : 'Validation Required'}
                  </span>
                </div>
                <div className={`text-xs mt-1 ${
                  validation.isValid ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {validation.message}
                </div>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              {isPublished 
                ? "This will remove all published versions and allow editing of the schedule."
                : "This will create a read-only, printable version of the schedule that can be shared publicly."
              }
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
              Cancel
            </Button>
            
            {isPublished ? (
              <Button 
                variant="destructive" 
                onClick={handleUnpublish} 
                disabled={loading}
              >
                {loading ? 'Unpublishing...' : 'Unpublish'}
              </Button>
            ) : publishedSchedule ? (
              <Button onClick={handleOpenLink} className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <span>View Published</span>
              </Button>
            ) : (
              <Button 
                onClick={handlePublish} 
                disabled={loading || !validation.isValid}
                className={!validation.isValid ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {loading ? 'Publishing...' : 'Publish'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

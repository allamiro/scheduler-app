'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export default function PublishedSchedulePage() {
  const params = useParams()
  const slug = params.slug as string
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPublishedSchedule()
  }, [slug])

  const loadPublishedSchedule = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getPublishedSchedule(slug)
      setHtmlContent(data.html_content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print button - hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50">
        <Button onClick={handlePrint} className="shadow-lg">
          <Printer className="h-4 w-4 mr-2" />
          Print Schedule
        </Button>
      </div>

      {/* Schedule content */}
      <div 
        className="p-8"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}

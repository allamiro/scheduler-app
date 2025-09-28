'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

interface Holiday {
  date: string // Gregorian date in YYYY-MM-DD format
  name: string
  type: 'national' | 'religious' | 'cultural'
}

interface HolidayLegendProps {
  weekStart: Date
  weekEnd: Date
}

// Sample holidays - in a real app, this would come from an API or database
const SAMPLE_HOLIDAYS: Holiday[] = [
  { date: '2025-09-22', name: 'Meskel', type: 'religious' },
  { date: '2025-09-23', name: 'Ethiopian New Year', type: 'national' },
  { date: '2025-09-25', name: 'Finding of the True Cross', type: 'religious' },
  { date: '2025-09-27', name: 'Meskel Demera', type: 'cultural' },
]

export function HolidayLegend({ weekStart, weekEnd }: HolidayLegendProps) {
  // Filter holidays that fall within the current week
  const weekHolidays = SAMPLE_HOLIDAYS.filter(holiday => {
    const holidayDate = new Date(holiday.date)
    return holidayDate >= weekStart && holidayDate <= weekEnd
  })

  if (weekHolidays.length === 0) {
    return null
  }

  const getHolidayTypeColor = (type: Holiday['type']) => {
    switch (type) {
      case 'national':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'religious':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cultural':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatHolidayDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <Card className="mb-4 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-amber-800">
          <Calendar className="h-5 w-5" />
          <span className="text-lg font-semibold">Holidays This Week</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {weekHolidays.map((holiday, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge 
                  variant="outline" 
                  className={`${getHolidayTypeColor(holiday.type)} font-medium`}
                >
                  {holiday.type}
                </Badge>
                <span className="font-semibold text-gray-900">{holiday.name}</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {formatHolidayDate(holiday.date)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-amber-200">
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span>National</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
              <span>Religious</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span>Cultural</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

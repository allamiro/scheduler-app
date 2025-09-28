'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'

interface Holiday {
  date: string // Gregorian date in YYYY-MM-DD format
  name: string
  type: 'national' | 'religious' | 'cultural'
}

interface HolidaySidebarProps {
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

export function HolidaySidebar({ weekStart, weekEnd }: HolidaySidebarProps) {
  // Filter holidays that fall within the current week
  const weekHolidays = SAMPLE_HOLIDAYS.filter(holiday => {
    const holidayDate = new Date(holiday.date)
    return holidayDate >= weekStart && holidayDate <= weekEnd
  })

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
    <div className="w-80 flex-shrink-0">
      <Card className="h-fit border-amber-200 bg-gradient-to-b from-amber-50 to-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-amber-800">
            <Calendar className="h-5 w-5" />
            <span className="text-lg font-semibold">Holidays This Week</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weekHolidays.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No holidays this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {weekHolidays.map((holiday, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant="outline" 
                      className={`${getHolidayTypeColor(holiday.type)} font-medium text-xs`}
                    >
                      {holiday.type}
                    </Badge>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatHolidayDate(holiday.date)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                    {holiday.name}
                  </h4>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-amber-200">
            <div className="text-xs text-gray-600 font-medium mb-2">Legend:</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-gray-600">National</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                <span className="text-gray-600">Religious</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-gray-600">Cultural</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

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

// 2025 Ethiopian holidays with Gregorian dates
const SAMPLE_HOLIDAYS: Holiday[] = [
  { date: '2025-01-07', name: 'Genna (Ethiopian Christmas)', type: 'religious' },
  { date: '2025-01-19', name: 'Timkat (Epiphany)', type: 'religious' },
  { date: '2025-03-02', name: 'Adwa Victory Day', type: 'national' },
  { date: '2025-03-31', name: 'Eid al-Fitr', type: 'religious' },
  { date: '2025-04-18', name: 'Good Friday (Siklet)', type: 'religious' },
  { date: '2025-04-20', name: 'Fasika (Ethiopian Easter)', type: 'religious' },
  { date: '2025-05-01', name: 'International Labour Day', type: 'national' },
  { date: '2025-05-05', name: 'Patriots\' Victory Day', type: 'national' },
  { date: '2025-05-28', name: 'Downfall of the Derg', type: 'national' },
  { date: '2025-06-07', name: 'Eid al-Adha', type: 'religious' },
  { date: '2025-09-05', name: 'Mawlid (Prophet\'s Birthday)', type: 'religious' },
  { date: '2025-09-11', name: 'Enkutatash (New Year)', type: 'national' },
  { date: '2025-09-27', name: 'Meskel (Finding of the True Cross)', type: 'religious' },
]

export function HolidaySidebar({ weekStart, weekEnd }: HolidaySidebarProps) {
  // Filter holidays that fall within the current week
  const weekHolidays = SAMPLE_HOLIDAYS.filter(holiday => {
    const holidayDate = new Date(holiday.date)
    // Normalize dates to compare only the date part (ignore time)
    const holidayDateOnly = new Date(holidayDate.getFullYear(), holidayDate.getMonth(), holidayDate.getDate())
    const weekStartOnly = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
    const weekEndOnly = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate())
    
    return holidayDateOnly >= weekStartOnly && holidayDateOnly <= weekEndOnly
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
    <Card className="h-fit border-amber-200 bg-gradient-to-b from-amber-50 to-yellow-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-2 text-amber-800">
            <Calendar className="h-4 w-4" />
            <span className="text-base font-semibold">Holidays</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weekHolidays.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No holidays this week</p>
            </div>
          ) : (
            <div className="space-y-2">
              {weekHolidays.map((holiday, index) => (
                <div key={index} className="bg-white rounded p-2 border border-amber-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Badge 
                      variant="outline" 
                      className={`${getHolidayTypeColor(holiday.type)} font-medium text-xs`}
                    >
                      {holiday.type.charAt(0).toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatHolidayDate(holiday.date)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-xs leading-tight">
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
  )
}

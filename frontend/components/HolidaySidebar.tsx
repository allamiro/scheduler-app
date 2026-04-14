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

// Ethiopian public holidays — Gregorian calendar dates
const SAMPLE_HOLIDAYS: Holiday[] = [
  // 2025
  { date: '2025-01-07', name: 'Genna (Ethiopian Christmas)', type: 'religious' },
  { date: '2025-01-19', name: 'Timkat (Epiphany)', type: 'religious' },
  { date: '2025-03-02', name: 'Adwa Victory Day', type: 'national' },
  { date: '2025-03-31', name: 'Eid al-Fitr', type: 'religious' },
  { date: '2025-04-18', name: 'Good Friday (Siklet)', type: 'religious' },
  { date: '2025-04-20', name: 'Fasika (Ethiopian Easter)', type: 'religious' },
  { date: '2025-05-01', name: 'International Labour Day', type: 'national' },
  { date: '2025-05-05', name: "Patriots' Victory Day", type: 'national' },
  { date: '2025-05-28', name: 'Downfall of the Derg', type: 'national' },
  { date: '2025-06-07', name: 'Eid al-Adha', type: 'religious' },
  { date: '2025-09-05', name: "Mawlid (Prophet's Birthday)", type: 'religious' },
  { date: '2025-09-11', name: 'Enkutatash (Ethiopian New Year)', type: 'national' },
  { date: '2025-09-27', name: 'Meskel (Finding of the True Cross)', type: 'religious' },
  // 2026
  { date: '2026-01-07', name: 'Genna (Ethiopian Christmas)', type: 'religious' },
  { date: '2026-01-19', name: 'Timkat (Epiphany)', type: 'religious' },
  { date: '2026-03-02', name: 'Adwa Victory Day', type: 'national' },
  { date: '2026-03-20', name: 'Eid al-Fitr', type: 'religious' },
  { date: '2026-04-03', name: 'Good Friday (Siklet)', type: 'religious' },
  { date: '2026-04-05', name: 'Fasika (Ethiopian Easter)', type: 'religious' },
  { date: '2026-05-01', name: 'International Labour Day', type: 'national' },
  { date: '2026-05-05', name: "Patriots' Victory Day", type: 'national' },
  { date: '2026-05-28', name: 'Downfall of the Derg', type: 'national' },
  { date: '2026-05-27', name: 'Eid al-Adha', type: 'religious' },
  { date: '2026-08-25', name: "Mawlid (Prophet's Birthday)", type: 'religious' },
  { date: '2026-09-11', name: 'Enkutatash (Ethiopian New Year)', type: 'national' },
  { date: '2026-09-27', name: 'Meskel (Finding of the True Cross)', type: 'religious' },
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
        return 'border-rose-300/60 bg-rose-400/30 text-rose-50'
      case 'religious':
        return 'border-sky-300/60 bg-sky-400/30 text-sky-50'
      case 'cultural':
        return 'border-emerald-300/60 bg-emerald-400/30 text-emerald-50'
      default:
        return 'border-white/30 bg-white/20 text-white'
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
    <Card className="h-fit rounded-2xl border border-white/20 bg-white/10 text-white shadow-[0_25px_80px_-40px_rgba(30,64,175,0.35)] backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-white">
          <Calendar className="h-4 w-4 text-indigo-100" />
          <span className="text-base font-semibold">Holidays</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {weekHolidays.length === 0 ? (
          <div className="py-6 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-indigo-200" />
            <p className="text-sm text-indigo-100/80">No holidays this week</p>
          </div>
        ) : (
          <div className="space-y-2">
            {weekHolidays.map((holiday, index) => (
              <div key={index} className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`${getHolidayTypeColor(holiday.type)} font-medium text-xs`}
                  >
                    {holiday.type.charAt(0).toUpperCase()}
                  </Badge>
                  <span className="text-xs font-medium text-indigo-100/80">
                    {formatHolidayDate(holiday.date)}
                  </span>
                </div>
                <h4 className="text-xs font-semibold leading-tight text-white">
                  {holiday.name}
                </h4>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-widest text-indigo-100/70">Legend</div>
          <div className="space-y-1 text-xs text-indigo-100/80">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded border border-rose-200/60 bg-rose-300/40"></div>
              <span>National</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded border border-sky-200/60 bg-sky-300/40"></div>
              <span>Religious</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded border border-emerald-200/60 bg-emerald-300/40"></div>
              <span>Cultural</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

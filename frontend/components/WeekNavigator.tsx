'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { addWeeks, formatDateISO } from '@/lib/utils'
import { formatWeekRangeWithEthiopian } from '@/lib/ethiopian-calendar'

interface WeekNavigatorProps {
  currentWeek: Date
  onWeekChange: (week: Date) => void
}

export function WeekNavigator({ currentWeek, onWeekChange }: WeekNavigatorProps) {
  const handlePreviousWeek = () => {
    onWeekChange(addWeeks(currentWeek, -1))
  }

  const handleNextWeek = () => {
    onWeekChange(addWeeks(currentWeek, 1))
  }

  const handleToday = () => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1) // Get Monday
    onWeekChange(weekStart)
  }

  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    return formatWeekRangeWithEthiopian(weekStart, weekEnd)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousWeek}
          className="flex items-center space-x-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="flex items-center space-x-1"
        >
          <Calendar className="h-4 w-4" />
          <span>Today</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextWeek}
          className="flex items-center space-x-1"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-sm font-medium text-gray-700">
        {formatWeekRange(currentWeek)}
      </div>
    </div>
  )
}

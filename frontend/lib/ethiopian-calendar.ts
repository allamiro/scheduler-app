// Ethiopian Calendar Utility
// Simple conversion for MVP - can be enhanced with proper Ethiopian calendar library

export interface EthiopianDate {
  year: number
  month: number
  day: number
  monthName: string
  yearName: string
}

// Ethiopian month names
const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahesas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase'
]

// Ethiopian year names (simplified - in practice this is more complex)
const ETHIOPIAN_YEARS = [
  '፲፱፻፹፯', '፲፱፻፹፰', '፲፱፻፹፱', '፲፱፻፺', '፲፱፻፺፩', '፲፱፻፺፪', '፲፱፻፺፫', '፲፱፻፺፬', '፲፱፻፺፭', '፲፱፻፺፮'
]

export function gregorianToEthiopian(date: Date): EthiopianDate {
  // Simple approximation - Ethiopian calendar is 7-8 years behind Gregorian
  const ethiopianYear = date.getFullYear() - 7
  
  // Ethiopian calendar starts around September 11th
  const ethiopianStartDate = new Date(date.getFullYear(), 8, 11) // September 11
  
  let ethiopianMonth: number
  let ethiopianDay: number
  
  if (date >= ethiopianStartDate) {
    // Same Ethiopian year
    const daysDiff = Math.floor((date.getTime() - ethiopianStartDate.getTime()) / (1000 * 60 * 60 * 24))
    ethiopianMonth = Math.floor(daysDiff / 30) + 1
    ethiopianDay = (daysDiff % 30) + 1
  } else {
    // Previous Ethiopian year
    const prevEthiopianStart = new Date(date.getFullYear() - 1, 8, 11)
    const daysDiff = Math.floor((date.getTime() - prevEthiopianStart.getTime()) / (1000 * 60 * 60 * 24))
    ethiopianMonth = Math.floor(daysDiff / 30) + 1
    ethiopianDay = (daysDiff % 30) + 1
  }
  
  // Ensure month is within 1-13 range (Ethiopian calendar has 13 months)
  if (ethiopianMonth > 13) {
    ethiopianMonth = 13
  }
  
  return {
    year: ethiopianYear,
    month: ethiopianMonth,
    day: ethiopianDay,
    monthName: ETHIOPIAN_MONTHS[ethiopianMonth - 1] || 'Unknown',
    yearName: ETHIOPIAN_YEARS[ethiopianYear % 10] || ethiopianYear.toString()
  }
}

export function formatEthiopianDate(date: Date): string {
  const ethiopian = gregorianToEthiopian(date)
  return `${ethiopian.monthName} ${ethiopian.day}, ${ethiopian.year} (${ethiopian.yearName})`
}

export function formatDateWithEthiopian(date: Date): string {
  const gregorian = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
  const ethiopian = formatEthiopianDate(date)
  return `${gregorian} / ${ethiopian}`
}

export function formatWeekRangeWithEthiopian(startDate: Date, endDate: Date): string {
  // Format Gregorian week range
  const gregorianStart = startDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
  const gregorianEnd = endDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
  const gregorianRange = `${gregorianStart} - ${gregorianEnd}`
  
  // Format Ethiopian week range
  const ethiopianStart = gregorianToEthiopian(startDate)
  const ethiopianEnd = gregorianToEthiopian(endDate)
  
  // If same month and year, show simplified format
  if (ethiopianStart.month === ethiopianEnd.month && ethiopianStart.year === ethiopianEnd.year) {
    const ethiopianRange = `${ethiopianStart.monthName} ${ethiopianStart.day} - ${ethiopianEnd.day}, ${ethiopianStart.year} (${ethiopianStart.yearName})`
    return `${gregorianRange} / ${ethiopianRange}`
  } else {
    // Different months/years - show full format
    const ethiopianStartFormatted = `${ethiopianStart.monthName} ${ethiopianStart.day}, ${ethiopianStart.year}`
    const ethiopianEndFormatted = `${ethiopianEnd.monthName} ${ethiopianEnd.day}, ${ethiopianEnd.year} (${ethiopianEnd.yearName})`
    const ethiopianRange = `${ethiopianStartFormatted} - ${ethiopianEndFormatted}`
    return `${gregorianRange} / ${ethiopianRange}`
  }
}

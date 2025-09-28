'use client'

import { ScheduleGridCell } from './ScheduleGridCell'
import { Schedule, Doctor, AssignmentType, ASSIGNMENT_TYPES } from '@/lib/types'
import { getWeekDates, formatDateISO } from '@/lib/utils'
import { formatEthiopianDate } from '@/lib/ethiopian-calendar'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table'

interface ScheduleGridProps {
  schedule: Schedule | null
  doctors: Doctor[]
  currentWeek: Date
  userRole?: string
  onAssignmentCreate: (assignment: {
    doctor_id: number
    assignment_date: string
    assignment_type: AssignmentType
  }) => void
  onAssignmentDelete: (assignmentId: number) => void
}

export function ScheduleGrid({
  schedule,
  doctors,
  currentWeek,
  userRole,
  onAssignmentCreate,
  onAssignmentDelete
}: ScheduleGridProps) {
  const weekDates = getWeekDates(currentWeek)

  const getAssignmentsForCell = (date: Date, assignmentType: AssignmentType) => {
    const dateStr = formatDateISO(date)
    return schedule?.assignments.filter(
      a => a.assignment_date === dateStr && a.assignment_type === assignmentType
    ) || []
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
      {/* Hospital and Department Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
            JIGJIGA UNIVERSITY SHY-COMPREHENSIVE SPECIALIZED HOSPITAL
          </h1>
          <div className="text-lg md:text-xl font-semibold text-blue-100">
            DEPARTMENT OF CLINICAL RADIOLOGY
          </div>
          <div className="text-base md:text-lg font-medium text-blue-200">
            RADIOLOGISTS WORKING AND DUTY SCHEDULE
          </div>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 border-b-2 border-blue-200">
            <TableHead className="w-[120px] text-center font-bold text-gray-800 text-sm md:text-base py-4 px-2">
              <div className="flex flex-col items-center space-y-1">
                <div className="text-blue-700 font-semibold">Date</div>
                <div className="text-xs text-blue-600 font-medium">(EC)</div>
              </div>
            </TableHead>
            <TableHead className="w-[100px] text-center font-bold text-gray-800 text-sm md:text-base py-4 px-2">
              <div className="text-purple-700 font-semibold">Day</div>
            </TableHead>
            {ASSIGNMENT_TYPES.map(type => (
              <TableHead 
                key={type.type} 
                className="min-w-[140px] text-center font-bold text-gray-800 text-sm md:text-base py-4 px-2"
              >
                <div className="space-y-1">
                  <div className="text-emerald-700 font-semibold">{type.label}</div>
                  <div className="text-xs font-medium text-emerald-600 bg-emerald-100 rounded-full px-2 py-1">
                    Max: {type.capacity}
                  </div>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {weekDates.map((date, dateIndex) => (
            <TableRow key={date.toISOString()} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 border-b border-gray-100">
              <TableCell className="text-center font-semibold text-gray-900 py-4 px-2 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="space-y-2">
                  <div className="text-sm md:text-base font-bold text-blue-800">{date.toISOString().split('T')[0]}</div>
                  <div className="text-xs text-blue-600 font-medium bg-blue-100 rounded-md px-2 py-1">{formatEthiopianDate(date)}</div>
                </div>
              </TableCell>
              <TableCell className="text-center font-semibold text-gray-900 py-4 px-2 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-sm md:text-base font-bold text-purple-700">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </TableCell>
              {ASSIGNMENT_TYPES.map(assignmentType => (
                <ScheduleGridCell
                  key={`${date.toISOString()}_${assignmentType.type}`}
                  date={date}
                  assignmentType={assignmentType.type}
                  assignments={getAssignmentsForCell(date, assignmentType.type)}
                  doctors={doctors}
                  userRole={userRole}
                  onAssignmentDelete={onAssignmentDelete}
                  onAssignmentCreate={onAssignmentCreate}
                />
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

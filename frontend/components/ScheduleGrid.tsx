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
    <div className="rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[120px] text-center font-semibold text-gray-700">
              Date (EC)
            </TableHead>
            <TableHead className="w-[100px] text-center font-semibold text-gray-700">
              Day
            </TableHead>
            {ASSIGNMENT_TYPES.map(type => (
              <TableHead 
                key={type.type} 
                className="min-w-[140px] text-center font-semibold text-gray-700"
              >
                <div className="space-y-1">
                  <div>{type.label}</div>
                  <div className="text-xs font-normal text-gray-500">
                    (Max: {type.capacity})
                  </div>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {weekDates.map((date, dateIndex) => (
            <TableRow key={date.toISOString()} className="hover:bg-gray-50/50">
              <TableCell className="text-center font-medium text-gray-900">
                <div className="space-y-1">
                  <div className="text-sm">{date.toISOString().split('T')[0]}</div>
                  <div className="text-xs text-gray-500">{formatEthiopianDate(date)}</div>
                </div>
              </TableCell>
              <TableCell className="text-center font-medium text-gray-900">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </TableCell>
              {ASSIGNMENT_TYPES.map(assignmentType => (
                <ScheduleGridCell
                  key={`${date.toISOString()}_${assignmentType.type}`}
                  date={date}
                  assignmentType={assignmentType.type}
                  assignments={getAssignmentsForCell(date, assignmentType.type)}
                  doctors={doctors}
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

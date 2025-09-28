'use client'

import { ScheduleGridCell } from './ScheduleGridCell'
import { Schedule, Doctor, AssignmentType, ASSIGNMENT_TYPES } from '@/lib/types'
import { getWeekDates, formatDateISO } from '@/lib/utils'

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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
              Date (EC)
            </th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
              Day
            </th>
            {ASSIGNMENT_TYPES.map(type => (
              <th key={type.type} className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 min-w-[120px]">
                {type.label}
                <div className="text-xs font-normal text-gray-500">
                  (Max: {type.capacity})
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weekDates.map((date, dateIndex) => (
            <tr key={date.toISOString()} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                {date.toISOString().split('T')[0]}
              </td>
              <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                {date.toLocaleDateString('en-US', { weekday: 'long' })}
              </td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

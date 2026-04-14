'use client'

import { Schedule, Doctor, Assignment, AssignmentType, ASSIGNMENT_TYPES } from '@/lib/types'
import { ScheduleGridCellDnD } from './ScheduleGridCellDnD'
import { formatEthiopianDate } from '@/lib/ethiopian-calendar'

interface ScheduleGridDnDProps {
  schedule: Schedule | null
  doctors: Doctor[]
  currentWeek: Date
  userRole?: string
  isPublished?: boolean
  onAssignmentCreate: (assignment: {
    doctor_id: number
    assignment_date: string
    assignment_type: AssignmentType
  }) => void
  onAssignmentDelete: (assignmentId: number) => void
}

// Short labels for compact display
const SHORT_LABELS: Record<string, string> = {
  ULTRASOUND_MORNING:   'US Morning',
  ULTRASOUND_AFTERNOON: 'US Afternoon',
  XRAY:                 'X-Ray',
  CT_SCAN:              'CT-Scan',
  MRI:                  'MRI',
  DUTY:                 'Duty',
}

export function ScheduleGridDnD({
  schedule,
  doctors,
  currentWeek,
  userRole,
  isPublished = false,
  onAssignmentCreate,
  onAssignmentDelete,
}: ScheduleGridDnDProps) {
  // Generate week dates Monday → Sunday
  const weekDates: Date[] = []
  const startOfWeek = new Date(currentWeek)
  startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1)
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    weekDates.push(d)
  }

  const getAssignmentsForCell = (date: Date, assignmentType: AssignmentType): Assignment[] => {
    const dateStr = date.toISOString().split('T')[0]
    return (
      schedule?.assignments.filter(
        a => a.assignment_date === dateStr && a.assignment_type === assignmentType
      ) || []
    )
  }

  // Column width allocation (must sum to 100)
  // Date: 13%, Day: 5%, 6 assignment cols share 82% → 13.67% each
  const colWidths = {
    date: '13%',
    day: '5%',
    assignment: `${82 / ASSIGNMENT_TYPES.length}%`,
  }

  return (
    /* outer wrapper: scroll only on small screens */
    <div className="w-full overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-xs">
        <colgroup>
          <col style={{ width: colWidths.date }} />
          <col style={{ width: colWidths.day }} />
          {ASSIGNMENT_TYPES.map(t => (
            <col key={t.type} style={{ width: colWidths.assignment }} />
          ))}
        </colgroup>

        {/* ── Header ── */}
        <thead>
          <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            {/* Date */}
            <th className="text-center align-middle py-2 px-1 font-semibold text-blue-700 text-xs leading-tight">
              <div>Date</div>
              <div className="text-[10px] text-blue-500 font-normal">(GC / EC)</div>
            </th>

            {/* Day */}
            <th className="text-center align-middle py-2 px-1 font-semibold text-purple-700 text-xs leading-tight">
              Day
            </th>

            {/* Assignment type columns */}
            {ASSIGNMENT_TYPES.map(type => (
              <th
                key={type.type}
                className="text-center align-middle py-2 px-1 font-semibold text-emerald-700 text-xs leading-tight"
              >
                <div className="truncate" title={type.label}>
                  {SHORT_LABELS[type.type] ?? type.label}
                </div>
                <div className="mt-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-100 rounded-full px-1">
                  Max {type.capacity}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {weekDates.map(date => {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
            const dateISO = date.toISOString().split('T')[0]
            const ethDate = formatEthiopianDate(date)

            return (
              <tr
                key={dateISO}
                className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-colors"
              >
                {/* Date cell */}
                <td className="text-center align-middle py-1.5 px-1 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="text-[10px] font-bold text-blue-800 leading-tight">{dateISO}</div>
                  <div className="text-[10px] text-blue-600 bg-blue-100 rounded px-1 mt-0.5 leading-tight break-words">
                    {ethDate}
                  </div>
                </td>

                {/* Day cell */}
                <td className="text-center align-middle py-1.5 px-1 bg-gradient-to-br from-purple-50 to-pink-50">
                  <span className="text-xs font-bold text-purple-700">{dayName}</span>
                </td>

                {/* Assignment cells */}
                {ASSIGNMENT_TYPES.map(assignmentType => (
                  <ScheduleGridCellDnD
                    key={`${dateISO}||${assignmentType.type}`}
                    date={date}
                    assignmentType={assignmentType.type}
                    assignments={getAssignmentsForCell(date, assignmentType.type)}
                    doctors={doctors}
                    userRole={userRole}
                    isPublished={isPublished}
                    onAssignmentDelete={onAssignmentDelete}
                    onAssignmentCreate={onAssignmentCreate}
                  />
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

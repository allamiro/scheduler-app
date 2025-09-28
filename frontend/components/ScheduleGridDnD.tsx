'use client'

import { Schedule, Doctor, Assignment, AssignmentType, ASSIGNMENT_TYPES } from '@/lib/types'
import { ScheduleGridCellDnD } from './ScheduleGridCellDnD'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatEthiopianDate } from '@/lib/ethiopian-calendar'

interface ScheduleGridDnDProps {
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

export function ScheduleGridDnD({
  schedule,
  doctors,
  currentWeek,
  userRole,
  onAssignmentCreate,
  onAssignmentDelete
}: ScheduleGridDnDProps) {
  // Generate week dates (Monday to Sunday)
  const weekDates: Date[] = []
  const startOfWeek = new Date(currentWeek)
  startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1) // Start from Monday
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    weekDates.push(date)
  }

  const getAssignmentsForCell = (date: Date, assignmentType: AssignmentType): Assignment[] => {
    const dateStr = date.toISOString().split('T')[0]
    return schedule?.assignments.filter(
      a => a.assignment_date === dateStr && a.assignment_type === assignmentType
    ) || []
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Hospital and Department Header - More Compact */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3 text-center">
        <div className="space-y-1">
          <h1 className="text-lg md:text-xl font-bold tracking-wide">
            JIGJIGA UNIVERSITY SHY-COMPREHENSIVE SPECIALIZED HOSPITAL
          </h1>
          <div className="text-sm md:text-base font-semibold text-blue-100">
            DEPARTMENT OF CLINICAL RADIOLOGY
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 border-b border-blue-200">
              <TableHead className="w-[120px] lg:w-[140px] text-center font-semibold text-gray-800 text-xs py-2 px-1">
                <div className="flex flex-col items-center space-y-0.5">
                  <div className="text-blue-700 font-medium">Date</div>
                  <div className="text-xs text-blue-600">(EC)</div>
                </div>
              </TableHead>
              <TableHead className="w-[80px] lg:w-[100px] text-center font-semibold text-gray-800 text-xs py-2 px-1">
                <div className="text-purple-700 font-medium">Day</div>
              </TableHead>
              {ASSIGNMENT_TYPES.map(type => (
                <TableHead 
                  key={type.type} 
                  className="min-w-[120px] lg:min-w-[140px] text-center font-semibold text-gray-800 text-xs py-2 px-1"
                >
                  <div className="space-y-0.5">
                    <div className="text-emerald-700 font-medium">{type.label}</div>
                    <div className="text-xs font-medium text-emerald-600 bg-emerald-100 rounded-full px-1 py-0.5">
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
                <TableCell className="text-center font-medium text-gray-900 py-2 px-1 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-blue-800">{date.toISOString().split('T')[0]}</div>
                    <div className="text-xs text-blue-600 font-medium bg-blue-100 rounded px-1 py-0.5">{formatEthiopianDate(date)}</div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium text-gray-900 py-2 px-1 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="text-xs font-bold text-purple-700">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </TableCell>
                {ASSIGNMENT_TYPES.map(assignmentType => (
                  <ScheduleGridCellDnD
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
    </div>
  )
}
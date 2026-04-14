'use client'

import { Assignment, AssignmentType, ASSIGNMENT_TYPES, Doctor } from '@/lib/types'
import { DoctorCard } from './DoctorCard'
import { X, Plus } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface ScheduleGridCellDnDProps {
  date: Date
  assignmentType: AssignmentType
  assignments: Assignment[]
  doctors: Doctor[]
  userRole?: string
  isPublished?: boolean
  onAssignmentDelete: (assignmentId: number) => void
  onAssignmentCreate: (assignment: {
    doctor_id: number
    assignment_date: string
    assignment_type: AssignmentType
  }) => void
}

export function ScheduleGridCellDnD({
  date,
  assignmentType,
  assignments,
  doctors,
  userRole,
  isPublished = false,
  onAssignmentDelete,
  onAssignmentCreate
}: ScheduleGridCellDnDProps) {
  
  const assignmentTypeConfig = ASSIGNMENT_TYPES.find(type => type.type === assignmentType)
  const isAtCapacity = assignments.length >= (assignmentTypeConfig?.capacity || 0)
  
  // Get available doctors (not assigned to this date)
  const assignedDoctorIds = assignments.map(a => a.doctor_id)
  const availableDoctors = doctors.filter(doctor => 
    doctor.is_active && 
    !assignedDoctorIds.includes(doctor.id) &&
    doctor.status === 'ACTIVE'
  )

  // Create unique droppable ID for this cell using a separator that won't conflict with assignment types
  const cellId = `${date.toISOString().split('T')[0]}||${assignmentType}`
  
  const isReadOnly = userRole === 'viewer' || isPublished

  const { isOver, setNodeRef } = useDroppable({
    id: cellId,
    disabled: isReadOnly || isAtCapacity,
    data: {
      date: date.toISOString().split('T')[0],
      assignmentType,
      capacity: assignmentTypeConfig?.capacity || 0,
      currentAssignments: assignments.length
    }
  })

  // Only drag and drop functionality - no double-click or modal

  return (
    <>
      <td
        ref={setNodeRef}
        className={cn(
          "p-1 relative transition-all duration-200 align-top",
          isReadOnly ? 'bg-gradient-to-br from-gray-50 to-gray-100 cursor-default border border-dashed border-gray-300' :
          isAtCapacity ? 'bg-gradient-to-br from-red-50 to-red-100 cursor-not-allowed border border-red-200' :
          'bg-gradient-to-br from-white to-emerald-50 cursor-pointer hover:bg-gradient-to-br hover:from-emerald-50 hover:to-blue-50 border border-emerald-200 hover:border-blue-300',
          isOver && !isAtCapacity && !isReadOnly && 'bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-400 shadow-lg scale-105',
          "rounded shadow-sm hover:shadow-md"
        )}
        title={isPublished ? 'Published — unpublish to edit' :
               userRole === 'viewer' ? 'Read-only view' :
               isAtCapacity ? `At capacity (${assignments.length}/${assignmentTypeConfig?.capacity})` :
               availableDoctors.length === 0 ? 'No available doctors' : 'Drag doctor here to assign'}
      >
        <div className="space-y-2">
          {assignments.map(assignment => (
            <div key={assignment.id} className="relative group">
              <DoctorCard 
                doctor={{
                  id: assignment.doctor_id,
                  name: assignment.doctor_name,
                  is_active: true,
                  status: 'ACTIVE' as const
                }}
                isAssignment
              />
              {!isReadOnly && (
                <button
                  onClick={() => onAssignmentDelete(assignment.id)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  title="Remove assignment"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          
          {assignments.length === 0 && !isAtCapacity && !isReadOnly && availableDoctors.length > 0 && (
            <div className="text-[10px] text-emerald-600 text-center py-2 flex flex-col items-center">
              <div className="bg-emerald-100 rounded-full p-0.5 mb-0.5">
                <Plus className="h-2.5 w-2.5 text-emerald-600" />
              </div>
              <span className="font-medium leading-tight">Drag here</span>
            </div>
          )}

          {isAtCapacity && (
            <div className="text-[10px] text-red-600 text-center mt-0.5 bg-red-100 rounded px-1 py-0.5 font-medium leading-tight">
              Full {assignments.length}/{assignmentTypeConfig?.capacity}
            </div>
          )}

          {/* Drag over indicator */}
          {isOver && !isAtCapacity && !isReadOnly && (
            <div className="absolute inset-0 bg-blue-200 bg-opacity-50 rounded flex items-center justify-center">
              <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                Drop here
              </div>
            </div>
          )}
        </div>
      </td>

    </>
  )
}

'use client'

import { useState } from 'react'
import { Assignment, AssignmentType, ASSIGNMENT_TYPES, Doctor } from '@/lib/types'
import { DoctorCard } from './DoctorCard'
import { X, Plus } from 'lucide-react'
import { TableCell } from '@/components/ui/table'

interface ScheduleGridCellProps {
  date: Date
  assignmentType: AssignmentType
  assignments: Assignment[]
  doctors: Doctor[]
  userRole?: string
  onAssignmentDelete: (assignmentId: number) => void
  onAssignmentCreate: (assignment: {
    doctor_id: number
    assignment_date: string
    assignment_type: AssignmentType
  }) => void
}

export function ScheduleGridCell({
  date,
  assignmentType,
  assignments,
  doctors,
  userRole,
  onAssignmentDelete,
  onAssignmentCreate
}: ScheduleGridCellProps) {
  const [showDoctorSelector, setShowDoctorSelector] = useState(false)
  
  const cellId = `${date.toISOString().split('T')[0]}_${assignmentType}`
  const assignmentTypeConfig = ASSIGNMENT_TYPES.find(at => at.type === assignmentType)
  const isAtCapacity = assignments.length >= (assignmentTypeConfig?.capacity || 0)
  
  // Get available doctors (not already assigned on this date)
  const assignedDoctorIds = assignments.map(a => a.doctor_id)
  const availableDoctors = doctors.filter(doctor => 
    !assignedDoctorIds.includes(doctor.id) && doctor.is_active
  )

  const handleDoubleClick = () => {
    if (userRole === 'viewer') return // Disable for viewers
    if (!isAtCapacity && availableDoctors.length > 0) {
      setShowDoctorSelector(true)
    }
  }

  const handleDoctorSelect = (doctorId: number) => {
    const assignmentData = {
      doctor_id: doctorId,
      assignment_date: date.toISOString().split('T')[0],
      assignment_type: assignmentType
    }
    
    onAssignmentCreate(assignmentData)
    setShowDoctorSelector(false)
  }

  const handleCloseSelector = () => {
    setShowDoctorSelector(false)
  }

  return (
    <>
      <TableCell 
        onDoubleClick={handleDoubleClick}
        className={`
          min-h-[100px] min-w-[140px] p-3 relative
          ${userRole === 'viewer' ? 'bg-gradient-to-br from-gray-50 to-gray-100 cursor-default border-2 border-dashed border-gray-300' : 
            isAtCapacity ? 'bg-gradient-to-br from-red-50 to-red-100 cursor-not-allowed border-2 border-red-200' : 
            'bg-gradient-to-br from-white to-emerald-50 cursor-pointer hover:bg-gradient-to-br hover:from-emerald-50 hover:to-blue-50 border-2 border-emerald-200 hover:border-blue-300'}
          transition-all duration-300 ease-in-out rounded-lg shadow-sm hover:shadow-md
        `}
        title={userRole === 'viewer' ? 'Read-only view' : 
               isAtCapacity ? 'At capacity' : 
               availableDoctors.length === 0 ? 'No available doctors' : 'Double-click to assign doctor'}
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
              {userRole !== 'viewer' && (
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
          
          {assignments.length === 0 && !isAtCapacity && userRole !== 'viewer' && (
            <div className="text-xs text-emerald-600 text-center py-6 flex flex-col items-center">
              <div className="bg-emerald-100 rounded-full p-2 mb-2">
                <Plus className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="font-medium">Double-click to assign</span>
            </div>
          )}
          
          {isAtCapacity && (
            <div className="text-xs text-red-600 text-center mt-2 bg-red-100 rounded-lg px-3 py-2 font-medium">
              At capacity ({assignments.length}/{assignmentTypeConfig?.capacity})
            </div>
          )}
        </div>
      </TableCell>

      {/* Doctor Selector Modal */}
      {showDoctorSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Doctor</h3>
              <button
                onClick={handleCloseSelector}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4 text-sm text-gray-600">
              <p><strong>Date:</strong> {date.toLocaleDateString()}</p>
              <p><strong>Assignment:</strong> {assignmentTypeConfig?.label}</p>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableDoctors.map(doctor => (
                <button
                  key={doctor.id}
                  onClick={() => handleDoctorSelect(doctor.id)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-gray-900">{doctor.name}</div>
                </button>
              ))}
            </div>
            
            {availableDoctors.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No available doctors for this date
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

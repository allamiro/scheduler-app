'use client'

import { useState, useEffect } from 'react'
import { createSwapy } from 'swapy'
import { Doctor } from '@/lib/types'
import { apiClient } from '@/lib/api'
import { Schedule, AssignmentType, ASSIGNMENT_TYPES } from '@/lib/types'
import { getWeekDates, formatDateISO } from '@/lib/utils'

interface DoctorCardProps {
  doctor: Doctor
  isDragging?: boolean
}

function DoctorCard({ doctor, isDragging = false }: DoctorCardProps) {
  return (
    <div
      className={`bg-white border border-gray-300 rounded-md p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow duration-200 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } select-none`}
      data-swapy-item={`doctor-${doctor.id}`}
    >
      <div className="font-medium text-gray-900">{doctor.name}</div>
      {doctor.email && (
        <div className="text-xs text-gray-500 mt-1">{doctor.email}</div>
      )}
      {doctor.phone && (
        <div className="text-xs text-gray-500">{doctor.phone}</div>
      )}
    </div>
  )
}

interface ScheduleCellProps {
  date: Date
  assignmentType: AssignmentType
  assignments: any[]
  onAssignmentDelete: (assignmentId: number) => void
}

function ScheduleCell({ date, assignmentType, assignments, onAssignmentDelete }: ScheduleCellProps) {
  const cellId = `${formatDateISO(date)}_${assignmentType}`
  const assignmentTypeConfig = ASSIGNMENT_TYPES.find(at => at.type === assignmentType)
  const isAtCapacity = assignments.length >= (assignmentTypeConfig?.capacity || 0)

  return (
    <td 
      className={`border border-gray-300 px-2 py-3 min-h-[80px] min-w-[120px] ${
        isAtCapacity ? 'bg-red-50' : 'bg-white'
      } transition-colors duration-200`}
      data-swapy-slot={cellId}
    >
      <div className="space-y-1">
        {assignments.map(assignment => (
          <div key={assignment.id} className="relative group">
            <div className="bg-blue-100 border border-blue-300 rounded-md p-2 text-sm">
              <div className="font-medium text-blue-900">{assignment.doctor_name}</div>
            </div>
            <button
              onClick={() => onAssignmentDelete(assignment.id)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
              title="Remove assignment"
            >
              ×
            </button>
          </div>
        ))}
        
        {assignments.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-2">
            Drop doctor here
          </div>
        )}
        
        {isAtCapacity && (
          <div className="text-xs text-red-500 text-center mt-1">
            At capacity
          </div>
        )}
      </div>
    </td>
  )
}

interface SwapyScheduleGridProps {
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

export function SwapyScheduleGrid({
  schedule,
  doctors,
  currentWeek,
  onAssignmentCreate,
  onAssignmentDelete
}: SwapyScheduleGridProps) {
  const [logs, setLogs] = useState<string[]>([])
  const weekDates = getWeekDates(currentWeek)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[${timestamp}] ${message}`)
  }

  const getAssignmentsForCell = (date: Date, assignmentType: AssignmentType) => {
    const dateStr = formatDateISO(date)
    return schedule?.assignments.filter(
      a => a.assignment_date === dateStr && a.assignment_type === assignmentType
    ) || []
  }

  useEffect(() => {
    const container = document.querySelector('.swapy-container') as HTMLElement
    if (!container) return

    addLog('Initializing Swapy drag-and-drop...')
    
    const swapy = createSwapy(container)
    
    swapy.onSwap((event) => {
      addLog(`Swap detected: ${JSON.stringify(event)}`)
      
      // Handle the swap event based on Swapy's actual API
      if (event && typeof event === 'object') {
        const { from, to } = event as any
        
        if (from && to) {
          // Extract doctor ID from the item
          const doctorId = parseInt(from.replace('doctor-', ''))
          
          // Extract date and assignment type from the slot
          const [dateStr, assignmentType] = to.split('_')
          
          addLog(`Processing drop: Doctor ${doctorId} -> ${dateStr} ${assignmentType}`)
          
          // Check if doctor is already assigned on this date
          const existingAssignment = schedule?.assignments.find(
            a => a.doctor_id === doctorId && a.assignment_date === dateStr
          )
          
          if (existingAssignment) {
            addLog(`❌ Doctor already assigned on this date`)
            alert('Doctor is already assigned on this date')
            return
          }
          
          // Check capacity
          const assignmentTypeConfig = ASSIGNMENT_TYPES.find(at => at.type === assignmentType)
          if (!assignmentTypeConfig) {
            addLog(`❌ Invalid assignment type: ${assignmentType}`)
            return
          }
          
          const currentAssignments = schedule?.assignments.filter(
            a => a.assignment_date === dateStr && a.assignment_type === assignmentType
          ) || []
          
          if (currentAssignments.length >= assignmentTypeConfig.capacity) {
            addLog(`❌ Capacity exceeded for ${assignmentTypeConfig.label}`)
            alert(`Capacity exceeded for ${assignmentTypeConfig.label}. Max: ${assignmentTypeConfig.capacity}`)
            return
          }

          const assignmentData = {
            doctor_id: doctorId,
            assignment_date: dateStr,
            assignment_type: assignmentType as AssignmentType
          }

          addLog(`✅ Creating assignment: ${JSON.stringify(assignmentData)}`)
          onAssignmentCreate(assignmentData)
        }
      }
    })

    addLog('Swapy initialized successfully')
    
    return () => {
      // Cleanup if needed
    }
  }, [schedule, onAssignmentCreate])

  return (
    <div className="space-y-4">
      {/* Debug Logs */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-yellow-800">Swapy Debug Logs</h3>
          <button 
            onClick={() => setLogs([])}
            className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs hover:bg-yellow-300"
          >
            Clear
          </button>
        </div>
        <div className="bg-white rounded border p-2 max-h-32 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-xs">No logs yet. Try dragging a doctor!</div>
          ) : (
            <pre className="text-xs text-gray-800 whitespace-pre-wrap">
              {logs.join('\n')}
            </pre>
          )}
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="swapy-container overflow-x-auto">
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
                  <ScheduleCell
                    key={`${date.toISOString()}_${assignmentType.type}`}
                    date={date}
                    assignmentType={assignmentType.type}
                    assignments={getAssignmentsForCell(date, assignmentType.type)}
                    onAssignmentDelete={onAssignmentDelete}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Doctor Cards */}
      <div className="swapy-container">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {doctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </div>
    </div>
  )
}

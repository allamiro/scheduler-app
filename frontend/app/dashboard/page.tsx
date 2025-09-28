'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScheduleGridDnD } from '@/components/ScheduleGridDnD'
import { DoctorSidebarDnD } from '@/components/DoctorSidebarDnD'
import { WeekNavigator } from '@/components/WeekNavigator'
import { PublishDialog } from '@/components/PublishDialog'
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog'
import { UserManagementDialog } from '@/components/UserManagementDialog'
import { HolidaySidebar } from '@/components/HolidaySidebar'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, rectIntersection } from '@dnd-kit/core'
import { apiClient } from '@/lib/api'
import { Schedule, Doctor, AssignmentType, ASSIGNMENT_TYPES } from '@/lib/types'
import { getWeekStart, formatDateISO } from '@/lib/utils'
import { Calendar, Users, LogOut, Bug, Key, Settings, History } from 'lucide-react'

// Debug logging system
class DragDropLogger {
  private logs: string[] = []
  
  log(message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}${data ? `: ${JSON.stringify(data)}` : ''}`
    this.logs.push(logEntry)
    console.log(logEntry)
  }
  
  getLogs() {
    return this.logs
  }
  
  clearLogs() {
    this.logs = []
  }
  
  exportLogs() {
    const logText = this.logs.join('\n')
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `drag-drop-debug-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
}

const logger = new DragDropLogger()

export default function DashboardPage() {
  const [currentWeek, setCurrentWeek] = useState<Date>(getWeekStart(new Date()))
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [currentWeek])

  const loadData = async () => {
    try {
      setLoading(true)
      logger.log('Loading data for week', { week: formatDateISO(currentWeek) })
      
      const [scheduleData, doctorsData, userData] = await Promise.all([
        apiClient.getScheduleByWeek(formatDateISO(currentWeek)),
        apiClient.getDoctors(),
        apiClient.getCurrentUser()
      ])
      
      logger.log('Data loaded successfully', {
        scheduleId: scheduleData?.id,
        doctorsCount: doctorsData.length,
        userRole: userData?.role
      })
      
      setSchedule(scheduleData)
      setDoctors(doctorsData.filter(d => d.is_active))
      setUser(userData)
    } catch (error) {
      logger.log('Failed to load data', { error: error instanceof Error ? error.message : 'Unknown error' })
      console.error('Failed to load data:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    apiClient.clearToken()
    router.push('/login')
  }


  const handleWeekChange = (newWeek: Date) => {
    logger.log('Week changed', { 
      from: formatDateISO(currentWeek), 
      to: formatDateISO(newWeek) 
    })
    setCurrentWeek(newWeek)
  }

  const handleAssignmentCreate = async (assignment: {
    doctor_id: number
    assignment_date: string
    assignment_type: AssignmentType
  }) => {
    try {
      logger.log('Starting assignment creation', assignment)
      
      if (!schedule?.id) {
        logger.log('No schedule exists, creating new schedule')
        // Create schedule if it doesn't exist
        const newSchedule = await apiClient.createSchedule(formatDateISO(currentWeek))
        logger.log('Schedule created', { scheduleId: newSchedule.id })
        setSchedule(newSchedule)
      }
      
      logger.log('Creating assignment via API', {
        scheduleId: schedule?.id,
        assignment
      })
      
      const newAssignment = await apiClient.createAssignment(schedule?.id || 0, assignment)
      
      logger.log('Assignment created successfully', {
        assignmentId: newAssignment.id,
        doctorName: newAssignment.doctor_name
      })
      
      setSchedule(prev => prev ? {
        ...prev,
        assignments: [...prev.assignments, newAssignment]
      } : null)
      
      logger.log('Schedule state updated with new assignment')
      
    } catch (error) {
      logger.log('Assignment creation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        assignment
      })
      console.error('Failed to create assignment:', error)
      alert(error instanceof Error ? error.message : 'Failed to create assignment')
    }
  }

  const handleAssignmentDelete = async (assignmentId: number) => {
    try {
      if (!schedule?.id) return
      
      logger.log('Deleting assignment', { assignmentId })
      
      await apiClient.deleteAssignment(schedule.id, assignmentId)
      setSchedule(prev => prev ? {
        ...prev,
        assignments: prev.assignments.filter(a => a.id !== assignmentId)
      } : null)
      
      logger.log('Assignment deleted successfully', { assignmentId })
      
    } catch (error) {
      logger.log('Assignment deletion failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        assignmentId
      })
      console.error('Failed to delete assignment:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete assignment')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    // Find the doctor being dragged
    if (active.id.toString().startsWith('doctor-')) {
      const doctorId = parseInt(active.id.toString().replace('doctor-', ''))
      const doctor = doctors.find(d => d.id === doctorId)
      setActiveDoctor(doctor || null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    console.log('Drag end event:', { activeId: active.id, overId: over?.id })
    
    setActiveId(null)
    setActiveDoctor(null)
    
    if (!over) {
      console.log('No drop target found')
      return
    }
    
    // Check if we're dropping on a schedule cell
    if (over.id.toString().includes('_') && active.id.toString().startsWith('doctor-')) {
      console.log('Dropping doctor on schedule cell')
      
      // Check user role first
      if (user?.role === 'viewer') {
        console.log('Viewer cannot make assignments')
        alert('You do not have permission to make assignments!')
        return
      }
      
      const doctorId = parseInt(active.id.toString().replace('doctor-', ''))
      const [dateStr, assignmentType] = over.id.toString().split('_')
      
      console.log('Assignment details:', { doctorId, dateStr, assignmentType })
      
      // Find the assignment type configuration
      const assignmentTypeConfig = ASSIGNMENT_TYPES.find(type => type.type === assignmentType)
      
      if (!assignmentTypeConfig) {
        console.log('Assignment type not found:', assignmentType)
        alert('Invalid assignment type!')
        return
      }
      
      // Check if the doctor is available for this assignment
      const existingAssignments = schedule?.assignments.filter(
        a => a.assignment_date === dateStr && a.assignment_type === assignmentType
      ) || []
      
      console.log('Capacity check:', { 
        existingCount: existingAssignments.length, 
        maxCapacity: assignmentTypeConfig.capacity,
        assignmentType: assignmentTypeConfig.label,
        assignmentTypeKey: assignmentType
      })
      
      // Check capacity
      if (existingAssignments.length >= assignmentTypeConfig.capacity) {
        console.log('Assignment at capacity')
        alert(`This assignment is at capacity! (${existingAssignments.length}/${assignmentTypeConfig.capacity})`)
        return
      }
      
      // Check if doctor is already assigned to this date
      const doctorAssignedToday = schedule?.assignments.some(
        a => a.doctor_id === doctorId && a.assignment_date === dateStr
      )
      
      if (doctorAssignedToday) {
        console.log('Doctor already assigned today')
        alert('This doctor is already assigned to this date!')
        return
      }
      
      console.log('Creating assignment')
      // Create the assignment
      handleAssignmentCreate({
        doctor_id: doctorId,
        assignment_date: dateStr,
        assignment_type: assignmentType as AssignmentType
      })
    } else {
      console.log('Invalid drop target or not a doctor')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Duty Scheduler</h1>
            </div>
            
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{user?.username} ({user?.role})</span>
                  </div>
                  
                  {/* Password Change */}
                  <ChangePasswordDialog />
                  
                  {/* User Management (Admin only) */}
                  {user?.role === 'admin' && (
                    <UserManagementDialog />
                  )}
                  
                  {/* Published History (Admin and Editor only) */}
                  {(user?.role === 'admin' || user?.role === 'editor') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/published-history')}
                      className="flex items-center space-x-2"
                    >
                      <History className="h-4 w-4" />
                      <span>Published History</span>
                    </Button>
                  )}
                  
                  {/* Debug Panel Toggle */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDebugPanel(!showDebugPanel)}
                    className="flex items-center space-x-2"
                  >
                    <Bug className="h-4 w-4" />
                    <span>Debug</span>
                  </Button>
                  
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
          </div>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-yellow-800">Drag & Drop Debug Panel</h3>
              <div className="space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => logger.clearLogs()}
                >
                  Clear Logs
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => logger.exportLogs()}
                >
                  Export Logs
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded border p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                {logger.getLogs().join('\n')}
              </pre>
            </div>
            
                {/* JavaScript Error Display - Removed ErrorDisplay component */}
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Current State:</strong>
                <ul className="mt-1 space-y-1">
                  <li>Schedule ID: {schedule?.id || 'None'}</li>
                  <li>Doctors Count: {doctors.length}</li>
                  <li>Assignments Count: {schedule?.assignments.length || 0}</li>
                  <li>Current Week: {formatDateISO(currentWeek)}</li>
                </ul>
              </div>
              <div>
                <strong>Swapy State:</strong>
                <ul className="mt-1 space-y-1">
                  <li>Swapy Container: {document.querySelector('.swapy-container') ? 'Found' : 'Not Found'}</li>
                  <li>Doctors with data-swapy-item: {doctors.length}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <DndContext
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Schedule Grid - Takes priority and most space */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Weekly Schedule
                    </h2>
                    {schedule?.id && user?.role !== 'viewer' && (
                      <PublishDialog 
                        scheduleId={schedule.id}
                        weekStart={currentWeek}
                        isPublished={schedule.is_published}
                        onUnpublish={() => {
                          // Reload schedule data after unpublishing
                          loadData()
                        }}
                      />
                    )}
                  </div>
                  
                  <WeekNavigator 
                    currentWeek={currentWeek}
                    onWeekChange={handleWeekChange}
                  />
                </div>
                
                <div className="p-4">
                  <ScheduleGridDnD
                    schedule={schedule}
                    doctors={doctors}
                    currentWeek={currentWeek}
                    userRole={user?.role}
                    onAssignmentCreate={handleAssignmentCreate}
                    onAssignmentDelete={handleAssignmentDelete}
                  />
                </div>
              </div>
            </div>

            {/* Right Sidebar - Doctors and Holidays stacked */}
            <div className="lg:w-80 xl:w-96 flex-shrink-0 space-y-4">
              {/* Doctors Panel */}
              <DoctorSidebarDnD 
                doctors={doctors}
                onDoctorUpdate={loadData}
                userRole={user?.role}
              />
              
              {/* Holidays Panel */}
              <HolidaySidebar 
                weekStart={currentWeek}
                weekEnd={new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000)}
              />
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeDoctor ? (
            <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-xl opacity-90">
              <div className="font-semibold text-gray-900">{activeDoctor.name}</div>
              {activeDoctor.position && (
                <div className="text-xs text-gray-600 mt-1 font-medium">{activeDoctor.position}</div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
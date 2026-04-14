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
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, rectIntersection, useDroppable } from '@dnd-kit/core'
import { apiClient } from '@/lib/api'
import { toast } from '@/lib/use-toast'
import { Schedule, Doctor, AssignmentType, ASSIGNMENT_TYPES } from '@/lib/types'
import { getWeekStart, formatDateISO } from '@/lib/utils'
import { Calendar, Users, LogOut, History, User, Sparkles } from 'lucide-react'

// Droppable Approver/Preparer Box Component
function DroppableApproverPreparerBox({ 
  id, 
  title, 
  assignedDoctor, 
  onRemove,
  userRole 
}: { 
  id: string
  title: string
  assignedDoctor: Doctor | null
  onRemove: () => void
  userRole?: string
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled: userRole === 'viewer'
  })

  return (
    <div
      ref={setNodeRef}
      className={`relative min-w-[140px] rounded-xl border-2 border-dashed p-3 transition-all duration-200 ${
        isOver && userRole !== 'viewer'
          ? 'scale-105 border-indigo-400/80 bg-indigo-100/60'
          : 'border-white/40 bg-white/70'
      } ${userRole === 'viewer' ? 'cursor-default' : 'cursor-pointer hover:border-white/60'}`}
    >
      <div className="text-center">
        <div className="mb-2 text-xs font-semibold text-slate-700">{title}</div>
        <div className="flex min-h-[30px] items-center justify-center">
          {assignedDoctor ? (
            <div className="flex items-center space-x-2">
              <div className="text-xs font-medium text-slate-900">{assignedDoctor.name}</div>
              {userRole !== 'viewer' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600"
                  title="Remove"
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              {userRole === 'viewer' ? 'Not assigned' : 'Drop doctor here'}
            </div>
          )}
        </div>
      </div>

      {isOver && userRole !== 'viewer' && (
        <div className="absolute inset-0 flex items-center justify-center rounded bg-indigo-200/60">
          <div className="rounded bg-indigo-500 px-2 py-1 text-xs font-medium text-white">
            Drop here
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [currentWeek, setCurrentWeek] = useState<Date>(getWeekStart(new Date()))
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null)
  const [preparedBy, setPreparedBy] = useState<Doctor | null>(null) // Preparer assignment
  const [approvedBy, setApprovedBy] = useState<Doctor | null>(null) // Approver assignment
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [currentWeek])

  const loadData = async () => {
    try {
      setLoading(true)
      const [scheduleData, doctorsData, userData] = await Promise.all([
        apiClient.getScheduleByWeek(formatDateISO(currentWeek)),
        apiClient.getDoctors(),
        apiClient.getCurrentUser()
      ])
      setSchedule(scheduleData)
      setDoctors(doctorsData.filter(d => d.is_active))
      setUser(userData)
    } catch (error) {
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
    setCurrentWeek(newWeek)
  }

  const handleAssignmentCreate = async (assignment: {
    doctor_id: number
    assignment_date: string
    assignment_type: AssignmentType
  }) => {
    try {
      let scheduleId = schedule?.id
      if (!scheduleId) {
        const newSchedule = await apiClient.createSchedule(formatDateISO(currentWeek))
        setSchedule(newSchedule)
        scheduleId = newSchedule.id
      }
      const newAssignment = await apiClient.createAssignment(scheduleId, assignment)
      setSchedule(prev => prev ? {
        ...prev,
        assignments: [...prev.assignments, newAssignment]
      } : null)
    } catch (error) {
      console.error('Failed to create assignment:', error)
      toast.error('Assignment failed', error instanceof Error ? error.message : 'Failed to create assignment')
    }
  }

  const handleAssignmentDelete = async (assignmentId: number) => {
    try {
      if (!schedule?.id) return
      await apiClient.deleteAssignment(schedule.id, assignmentId)
      setSchedule(prev => prev ? {
        ...prev,
        assignments: prev.assignments.filter(a => a.id !== assignmentId)
      } : null)
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      toast.error('Delete failed', error instanceof Error ? error.message : 'Failed to delete assignment')
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

    setActiveId(null)
    setActiveDoctor(null)

    if (!over) return

    // Dropping on Approver/Preparer boxes
    if ((over.id.toString() === 'prepared-by' || over.id.toString() === 'approved-by') && active.id.toString().startsWith('doctor-')) {
      const doctorId = parseInt(active.id.toString().replace('doctor-', ''))
      const doctor = doctors.find(d => d.id === doctorId)
      if (!doctor) return

      if (over.id.toString() === 'prepared-by') {
        setPreparedBy(doctor)
      } else {
        setApprovedBy(doctor)
      }
      return
    }

    // Dropping on a schedule cell
    if (over.id.toString().includes('||') && active.id.toString().startsWith('doctor-')) {
      if (user?.role === 'viewer') {
        toast.warning('Read-only', 'Viewers cannot make assignments')
        return
      }

      const doctorId = parseInt(active.id.toString().replace('doctor-', ''))
      const overIdParts = over.id.toString().split('||')

      if (overIdParts.length !== 2) return

      const [dateStr, assignmentType] = overIdParts
      const assignmentTypeConfig = ASSIGNMENT_TYPES.find(type => type.type === assignmentType)

      if (!assignmentTypeConfig) {
        toast.error('Invalid drop target', `Unknown assignment type: ${assignmentType}`)
        return
      }

      const existingAssignments = schedule?.assignments.filter(
        a => a.assignment_date === dateStr && a.assignment_type === assignmentType
      ) || []

      if (existingAssignments.length >= assignmentTypeConfig.capacity) {
        toast.warning('At capacity', `${assignmentTypeConfig.label} is full (${existingAssignments.length}/${assignmentTypeConfig.capacity})`)
        return
      }

      const doctorAssignedToday = schedule?.assignments.some(
        a => a.doctor_id === doctorId && a.assignment_date === dateStr
      )

      if (doctorAssignedToday) {
        toast.warning('Already assigned', 'This doctor already has an assignment on this date')
        return
      }

      handleAssignmentCreate({
        doctor_id: doctorId,
        assignment_date: dateStr,
        assignment_type: assignmentType as AssignmentType
      })
    }
  }

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-grid-slate-900 opacity-40" />
          <div className="absolute left-1/2 top-[15%] h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.45),rgba(15,23,42,0))] blur-3xl" />
          <div className="absolute bottom-[-18%] right-[-10%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.28),rgba(15,23,42,0))] blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-6 text-center text-slate-100">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-[0_20px_60px_-25px_rgba(30,64,175,0.8)]">
            <div className="absolute inset-1 rounded-full border border-indigo-300/60" />
            <div className="absolute h-18 w-18 animate-spin-slow rounded-full border-2 border-transparent border-t-indigo-200/80" />
            <Sparkles className="h-7 w-7 text-indigo-100" />
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-200/80">Synchronizing schedule data</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">Loading dashboard</h2>
            <p className="max-w-lg text-sm text-slate-200/80 sm:text-base">
              Fetching rosters, users, and configuration so you can plan the week seamlessly.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-100/80">
            <span className="h-2 w-2 rounded-full bg-indigo-300 animate-pulse" />
            Connecting to scheduling engine
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/80 via-sky-500/70 to-purple-500/80 shadow-[0_15px_45px_-20px_rgba(59,130,246,0.75)]">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Duty Scheduler</h1>
              <p className="text-sm text-indigo-100/80">Orchestrate radiology coverage with clarity</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100/90">
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
                className="flex items-center gap-2 rounded-full border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              >
                <History className="h-4 w-4" />
                <span>Published History</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleLogout}
              className="rounded-full border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <DndContext
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="mx-auto w-full max-w-screen-2xl px-2 py-4 sm:px-4 lg:px-6">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-2 shadow-[0_35px_120px_-45px_rgba(30,64,175,0.7)] backdrop-blur sm:p-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Schedule Grid - Takes priority and most space */}
              <div className="flex-1 min-w-0 overflow-hidden rounded-3xl border border-white/15 bg-white/95 text-slate-900 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.35)]">
                {/* Hospital and Department Header */}
                <div className="bg-gradient-to-r from-indigo-600/90 via-sky-500/80 to-purple-500/80 px-4 py-6 text-center text-white sm:px-6">
                  <div className="space-y-1">
                    <h1 className="text-lg font-bold tracking-wide md:text-xl">
                      JIGJIGA UNIVERSITY SHY-COMPREHENSIVE SPECIALIZED HOSPITAL
                    </h1>
                    <div className="text-sm font-semibold text-indigo-100/80 md:text-base">
                      DEPARTMENT OF CLINICAL RADIOLOGY
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/50">
                  <div className="border-b border-slate-200/60 px-4 py-6 sm:px-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Weekly Schedule
                      </h2>

                      {/* Approver and Preparer Boxes - Centered */}
                      <div className="flex items-center justify-center gap-4">
                        <DroppableApproverPreparerBox
                          id="prepared-by"
                          title="Prepared by"
                          assignedDoctor={preparedBy}
                          onRemove={() => setPreparedBy(null)}
                          userRole={user?.role}
                        />

                        <DroppableApproverPreparerBox
                          id="approved-by"
                          title="Approved by"
                          assignedDoctor={approvedBy}
                          onRemove={() => setApprovedBy(null)}
                          userRole={user?.role}
                        />
                      </div>

                      {schedule?.id && user?.role !== 'viewer' && (
                        <PublishDialog
                          scheduleId={schedule.id}
                          weekStart={currentWeek}
                          schedule={schedule}
                          preparedBy={preparedBy}
                          approvedBy={approvedBy}
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

                  <div className="px-1 py-2 sm:px-2">
                    <ScheduleGridDnD
                      schedule={schedule}
                      doctors={doctors}
                      currentWeek={currentWeek}
                      userRole={user?.role}
                      isPublished={schedule?.is_published ?? false}
                      onAssignmentCreate={handleAssignmentCreate}
                      onAssignmentDelete={handleAssignmentDelete}
                    />
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Doctors and Holidays stacked */}
              <div className="flex-shrink-0 space-y-4 lg:w-64 xl:w-72">
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
        </div>

        <DragOverlay>
          {activeDoctor ? (
            <div className="rounded-2xl border border-indigo-300/60 bg-white/95 p-3 shadow-xl shadow-indigo-500/30">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" />
                <div className="font-semibold text-slate-900">{activeDoctor.name}</div>
              </div>
              {activeDoctor.position && (
                <div className="mt-1 text-xs font-medium text-slate-600">{activeDoctor.position}</div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
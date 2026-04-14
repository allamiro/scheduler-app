'use client'

import { useState } from 'react'
import { Doctor } from '@/lib/types'
import { DraggableDoctorCard } from './DraggableDoctorCard'
import { AddDoctorDialog } from './AddDoctorDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { toast } from '@/lib/use-toast'

interface DoctorSidebarDnDProps {
  doctors: Doctor[]
  onDoctorUpdate: () => void
  userRole?: string
}

export function DoctorSidebarDnD({ doctors, onDoctorUpdate, userRole }: DoctorSidebarDnDProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  // Tracks which doctor ID is pending confirmation of deletion
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  // Tracks a doctor that has assignments and needs a second-step confirm to clear + delete
  const [pendingClearAndDelete, setPendingClearAndDelete] = useState<{ id: number; message: string } | null>(null)

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteDoctor = async (doctorId: number) => {
    // First click — ask for confirmation inline instead of window.confirm
    if (pendingDeleteId !== doctorId) {
      setPendingDeleteId(doctorId)
      return
    }
    // Second click — confirmed
    setPendingDeleteId(null)
    try {
      await apiClient.deleteDoctor(doctorId)
      onDoctorUpdate()
      toast.success('Doctor deleted')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete doctor'
      if (errorMessage.includes('assignment(s)')) {
        // Offer clear-and-delete
        setPendingClearAndDelete({ id: doctorId, message: errorMessage })
      } else {
        toast.error('Delete failed', errorMessage)
      }
    }
  }

  const handleClearAndDelete = async () => {
    if (!pendingClearAndDelete) return
    const { id } = pendingClearAndDelete
    setPendingClearAndDelete(null)
    try {
      const result = await apiClient.clearDoctorAssignments(id)
      await apiClient.deleteDoctor(id)
      onDoctorUpdate()
      toast.success('Doctor deleted', result.message)
    } catch (error) {
      toast.error('Failed', error instanceof Error ? error.message : 'Could not clear assignments')
    }
  }

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setShowAddDialog(true)
  }

  const handleDialogClose = () => {
    setShowAddDialog(false)
    setEditingDoctor(null)
  }

  const handleDialogSuccess = () => {
    onDoctorUpdate()
    handleDialogClose()
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/95 shadow-[0_25px_80px_-40px_rgba(30,64,175,0.35)] backdrop-blur">
      <div className="p-4 border-b border-slate-200/70">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900">Doctors</h3>
          {userRole !== 'viewer' && (
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="flex items-center space-x-1 rounded-full"
            >
              <Plus className="h-3 w-3" />
              <span className="text-xs">Add</span>
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 rounded-full border-slate-200/60 bg-white/80 pl-9 text-sm focus-visible:ring-indigo-300"
          />
        </div>
      </div>

      {/* Clear-and-delete confirmation banner */}
      {pendingClearAndDelete && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold mb-1">Doctor has existing assignments</p>
          <p className="mb-2 leading-snug">Clear all assignments and delete this doctor?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleClearAndDelete}>
              Clear &amp; Delete
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPendingClearAndDelete(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="space-y-2">
          {filteredDoctors.map(doctor => (
            <div key={doctor.id} className="relative group">
              <DraggableDoctorCard doctor={doctor} />

              {/* Action buttons */}
              {userRole !== 'viewer' && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                  <button
                    onClick={() => handleEditDoctor(doctor)}
                    className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                    title="Edit doctor"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteDoctor(doctor.id)}
                    className={`text-white rounded-full p-1 transition-colors ${
                      pendingDeleteId === doctor.id
                        ? 'bg-red-700 ring-2 ring-red-400'
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                    title={pendingDeleteId === doctor.id ? 'Click again to confirm' : 'Delete doctor'}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Inline "click again to confirm" label */}
              {pendingDeleteId === doctor.id && (
                <div className="mt-1 text-[10px] text-red-600 text-right pr-1 font-medium">
                  Click again to confirm delete
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="py-4 text-center text-slate-500">
            {searchTerm ? 'No doctors found matching your search.' : 'No doctors available.'}
          </div>
        )}
      </div>

      {/* Add/Edit Doctor Dialog */}
      {showAddDialog && (
        <AddDoctorDialog
          doctor={editingDoctor}
          onSuccess={handleDialogSuccess}
          onClose={handleDialogClose}
        />
      )}
    </div>
  )
}

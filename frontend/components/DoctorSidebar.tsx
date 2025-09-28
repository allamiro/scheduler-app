'use client'

import { useState } from 'react'
import { Doctor } from '@/lib/types'
import { DoctorCard } from './DoctorCard'
import { AddDoctorDialog } from './AddDoctorDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface DoctorSidebarProps {
  doctors: Doctor[]
  onDoctorUpdate: () => void
  userRole?: string
}

export function DoctorSidebar({ doctors, onDoctorUpdate, userRole }: DoctorSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteDoctor = async (doctorId: number) => {
    if (confirm('Are you sure you want to delete this doctor?')) {
      try {
        await apiClient.deleteDoctor(doctorId)
        onDoctorUpdate()
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete doctor')
      }
    }
  }

  const handleToggleActive = async (doctor: Doctor) => {
    try {
      await apiClient.updateDoctor(doctor.id, { is_active: !doctor.is_active })
      onDoctorUpdate()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update doctor')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Doctors</h3>
          {userRole !== 'viewer' && (
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Doctor</span>
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {filteredDoctors.map(doctor => (
            <div key={doctor.id} className="relative group">
              <DoctorCard doctor={doctor} />
              
              {/* Action buttons */}
              {userRole !== 'viewer' && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                  <button
                    onClick={() => setEditingDoctor(doctor)}
                    className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors duration-200"
                    title="Edit doctor"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteDoctor(doctor.id)}
                    className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                    title="Delete doctor"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {/* Status indicator */}
              <div className={`absolute top-2 left-2 w-2 h-2 rounded-full ${
                doctor.is_active ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
          ))}
          
          {filteredDoctors.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? 'No doctors found' : 'No doctors available'}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Doctor Dialog */}
      {userRole !== 'viewer' && (showAddDialog || editingDoctor) && (
        <AddDoctorDialog
          doctor={editingDoctor}
          onClose={() => {
            setShowAddDialog(false)
            setEditingDoctor(null)
          }}
          onSuccess={() => {
            onDoctorUpdate()
            setShowAddDialog(false)
            setEditingDoctor(null)
          }}
        />
      )}
    </div>
  )
}

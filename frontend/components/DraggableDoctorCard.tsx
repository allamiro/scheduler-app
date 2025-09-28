'use client'

import { useDraggable } from '@dnd-kit/core'
import { Doctor } from '@/lib/types'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface DraggableDoctorCardProps {
  doctor: Doctor
  isAssignment?: boolean
}

export function DraggableDoctorCard({ doctor, isAssignment = false }: DraggableDoctorCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `doctor-${doctor.id}`,
    data: {
      type: 'doctor',
      doctor: doctor
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'ON_LEAVE':
        return 'bg-yellow-500'
      case 'INACTIVE':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active'
      case 'ON_LEAVE':
        return 'On Leave'
      case 'INACTIVE':
        return 'Inactive'
      default:
        return 'Unknown'
    }
  }

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  if (isAssignment) {
    return (
      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-lg p-3 text-sm shadow-sm">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-blue-600" />
          <div className="font-semibold text-blue-900">{doctor.name}</div>
        </div>
        {doctor.position && (
          <div className="text-xs text-blue-700 mt-1 font-medium">{doctor.position}</div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 hover:from-blue-50 hover:to-white",
        isDragging && "opacity-50 shadow-xl scale-105 z-50",
        "select-none"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <User className="h-3 w-3 text-gray-600" />
          <div className="font-medium text-gray-900 text-sm">{doctor.name}</div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(doctor.status)}`} title={getStatusText(doctor.status)}></div>
        </div>
      </div>
      {doctor.position && (
        <div className="text-xs text-gray-600 mt-1 font-medium bg-gray-100 rounded px-1 py-0.5">{doctor.position}</div>
      )}
      {doctor.email && (
        <div className="text-xs text-gray-500 mt-1">{doctor.email}</div>
      )}
      {doctor.phone && (
        <div className="text-xs text-gray-500">{doctor.phone}</div>
      )}
    </div>
  )
}

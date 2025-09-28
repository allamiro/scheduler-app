'use client'

import { useDraggable } from '@dnd-kit/core'
import { Doctor } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DoctorCardProps {
  doctor: Doctor
  isDragging?: boolean
  isAssignment?: boolean
}

export function DoctorCard({ doctor, isDragging = false, isAssignment = false }: DoctorCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingContext } = useDraggable({
    id: doctor.id.toString(),
    disabled: isAssignment,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  if (isAssignment) {
    return (
      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-lg p-3 text-sm shadow-sm">
        <div className="font-semibold text-blue-900">{doctor.name}</div>
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
        "bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300 hover:from-blue-50 hover:to-white",
        (isDragging || isDraggingContext) && "opacity-50 shadow-xl scale-105",
        "select-none"
      )}
    >
      <div className="font-semibold text-gray-900">{doctor.name}</div>
      {doctor.position && (
        <div className="text-xs text-gray-600 mt-1 font-medium bg-gray-100 rounded-md px-2 py-1">{doctor.position}</div>
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

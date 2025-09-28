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
      <div className="bg-blue-100 border border-blue-300 rounded-md p-2 text-sm">
        <div className="font-medium text-blue-900">{doctor.name}</div>
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
        "bg-white border border-gray-300 rounded-md p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow duration-200",
        (isDragging || isDraggingContext) && "opacity-50 shadow-lg",
        "select-none"
      )}
    >
      <div className="font-medium text-gray-900">{doctor.name}</div>
    </div>
  )
}

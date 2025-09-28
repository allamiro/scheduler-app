'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { DoctorCard } from '@/components/DoctorCard'
import { Doctor } from '@/lib/types'

// Simple test doctors
const testDoctors: Doctor[] = [
  { id: 1, name: 'Dr. Test 1', email: 'test1@test.com', is_active: true },
  { id: 2, name: 'Dr. Test 2', email: 'test2@test.com', is_active: true },
  { id: 3, name: 'Dr. Test 3', email: 'test3@test.com', is_active: true }
]

export default function DragDropTestPage() {
  const [draggedDoctor, setDraggedDoctor] = useState<Doctor | null>(null)
  const [droppedDoctor, setDroppedDoctor] = useState<Doctor | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[${timestamp}] ${message}`)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const doctorId = event.active.id as string
    const doctor = testDoctors.find(d => d.id.toString() === doctorId)
    
    addLog(`Drag started: ${doctor?.name} (ID: ${doctorId})`)
    setDraggedDoctor(doctor || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    addLog(`Drag ended: ${active.id} -> ${over?.id || 'nothing'}`)
    
    if (over) {
      const doctorId = active.id as string
      const doctor = testDoctors.find(d => d.id.toString() === doctorId)
      setDroppedDoctor(doctor || null)
      addLog(`✅ Successfully dropped: ${doctor?.name}`)
    } else {
      addLog(`❌ Drop failed: No valid drop target`)
    }
    
    setDraggedDoctor(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Drag & Drop Test Page</h1>
        
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Draggable Doctors */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Draggable Doctors</h2>
              <div className="space-y-3">
                {testDoctors.map(doctor => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            </div>

            {/* Drop Zone */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Drop Zone</h2>
              <div 
                className="min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center"
                style={{
                  backgroundColor: droppedDoctor ? '#f0f9ff' : '#f9fafb',
                  borderColor: droppedDoctor ? '#3b82f6' : '#d1d5db'
                }}
              >
                {droppedDoctor ? (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      ✅ Dropped: {droppedDoctor.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Email: {droppedDoctor.email}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center">
                    <div className="text-lg">Drop a doctor here</div>
                    <div className="text-sm mt-2">Drag from the left panel</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DragOverlay>
            {draggedDoctor ? (
              <DoctorCard doctor={draggedDoctor} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Logs */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Debug Logs</h2>
            <button 
              onClick={() => setLogs([])}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
          <div className="bg-gray-100 rounded p-4 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No logs yet. Try dragging a doctor!
              </div>
            ) : (
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {logs.join('\n')}
              </pre>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Test Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Try dragging a doctor card from the left panel</li>
            <li>Drop it in the drop zone on the right</li>
            <li>Watch the debug logs for detailed information</li>
            <li>Check if the doctor appears in the drop zone</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <strong className="text-blue-900">Expected Behavior:</strong>
            <ul className="mt-1 text-blue-800">
              <li>• Doctor cards should be draggable (cursor changes to grab)</li>
              <li>• Drop zone should highlight when hovering</li>
              <li>• Doctor should appear in drop zone after successful drop</li>
              <li>• Debug logs should show each step</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

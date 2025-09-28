'use client'

import { useState, useEffect } from 'react'
import { createSwapy } from 'swapy'
import { Doctor } from '@/lib/types'
import { apiClient } from '@/lib/api'

// Simple test doctors
const testDoctors: Doctor[] = [
  { id: 1, name: 'Dr. Test 1', email: 'test1@test.com', is_active: true },
  { id: 2, name: 'Dr. Test 2', email: 'test2@test.com', is_active: true },
  { id: 3, name: 'Dr. Test 3', email: 'test3@test.com', is_active: true },
  { id: 4, name: 'Dr. Test 4', email: 'test4@test.com', is_active: true }
]

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div
      className="bg-white border border-gray-300 rounded-md p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow duration-200 select-none"
      data-swapy-item={`doctor-${doctor.id}`}
    >
      <div className="font-medium text-gray-900">{doctor.name}</div>
      <div className="text-xs text-gray-500 mt-1">{doctor.email}</div>
    </div>
  )
}

function DropZone({ id, label, droppedDoctor }: { id: string, label: string, droppedDoctor: Doctor | null }) {
  return (
    <div 
      className={`min-h-[120px] border-2 border-dashed rounded-lg p-4 flex items-center justify-center transition-colors duration-200 ${
        droppedDoctor 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
      data-swapy-slot={id}
    >
      {droppedDoctor ? (
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            ✅ {droppedDoctor.name}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {droppedDoctor.email}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-center">
          <div className="text-lg">{label}</div>
          <div className="text-sm mt-2">Drop doctor here</div>
        </div>
      )}
    </div>
  )
}

export default function SwapyTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [droppedDoctors, setDroppedDoctors] = useState<Record<string, Doctor | null>>({
    'slot-1': null,
    'slot-2': null,
    'slot-3': null,
    'slot-4': null
  })

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[${timestamp}] ${message}`)
  }

  useEffect(() => {
    const container = document.querySelector('.swapy-container') as HTMLElement
    if (!container) return

    addLog('Initializing Swapy...')
    
    const swapy = createSwapy(container)
    
    swapy.onSwap((event) => {
      addLog(`Swap event: ${JSON.stringify(event)}`)
      
      // Handle the swap event based on Swapy's actual API
      if (event && typeof event === 'object') {
        const { from, to } = event as any
        
        if (from && to) {
          // Extract doctor ID
          const doctorId = parseInt(from.replace('doctor-', ''))
          const doctor = testDoctors.find(d => d.id === doctorId)
          
          if (doctor) {
            addLog(`✅ Doctor ${doctor.name} dropped in ${to}`)
            
            // Update dropped doctors state
            setDroppedDoctors(prev => ({
              ...prev,
              [to]: doctor
            }))
          }
        }
      }
    })

    addLog('Swapy initialized successfully!')
    
    return () => {
      addLog('Swapy cleanup')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Swapy Drag & Drop Test</h1>
        
        <div className="swapy-container space-y-8">
          {/* Doctor Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Draggable Doctors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {testDoctors.map(doctor => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          </div>

          {/* Drop Zones */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Drop Zones</h2>
            <div className="grid grid-cols-2 gap-4">
              <DropZone 
                id="slot-1" 
                label="Morning Shift" 
                droppedDoctor={droppedDoctors['slot-1']} 
              />
              <DropZone 
                id="slot-2" 
                label="Afternoon Shift" 
                droppedDoctor={droppedDoctors['slot-2']} 
              />
              <DropZone 
                id="slot-3" 
                label="Night Shift" 
                droppedDoctor={droppedDoctors['slot-3']} 
              />
              <DropZone 
                id="slot-4" 
                label="Emergency" 
                droppedDoctor={droppedDoctors['slot-4']} 
              />
            </div>
          </div>
        </div>

        {/* Debug Logs */}
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
            <li>Try dragging a doctor card from the top panel</li>
            <li>Drop it in any of the drop zones below</li>
            <li>Watch the debug logs for detailed information</li>
            <li>Check if the doctor appears in the drop zone</li>
            <li>Try dragging between different drop zones</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <strong className="text-blue-900">Expected Behavior:</strong>
            <ul className="mt-1 text-blue-800">
              <li>• Doctor cards should be draggable (cursor changes to grab)</li>
              <li>• Drop zones should highlight when hovering</li>
              <li>• Doctor should appear in drop zone after successful drop</li>
              <li>• Debug logs should show each step</li>
              <li>• You can drag doctors between different zones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

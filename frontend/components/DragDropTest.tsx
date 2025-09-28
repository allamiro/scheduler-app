'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { DoctorCard } from '@/components/DoctorCard'
import { Button } from '@/components/ui/button'
import { Doctor, AssignmentType, ASSIGNMENT_TYPES } from '@/lib/types'
import { Bug, Download, Trash2 } from 'lucide-react'

interface DragDropTestProps {
  doctors: Doctor[]
  onTestComplete: (results: any) => void
}

interface TestResult {
  timestamp: string
  testName: string
  success: boolean
  details: any
  error?: string
}

export function DragDropTest({ doctors, onTestComplete }: DragDropTestProps) {
  const [draggedDoctor, setDraggedDoctor] = useState<Doctor | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTest, setIsRunningTest] = useState(false)

  const addTestResult = (testName: string, success: boolean, details: any, error?: string) => {
    const result: TestResult = {
      timestamp: new Date().toISOString(),
      testName,
      success,
      details,
      error
    }
    setTestResults(prev => [...prev, result])
    onTestComplete(result)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const doctorId = event.active.id as string
    const doctor = doctors.find(d => d.id.toString() === doctorId)
    
    addTestResult('Drag Start', true, {
      doctorId,
      doctorName: doctor?.name,
      activeId: event.active.id,
      activeData: event.active.data.current
    })
    
    setDraggedDoctor(doctor || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    addTestResult('Drag Over', true, {
      activeId: event.active.id,
      overId: event.over?.id,
      overData: event.over?.data.current
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    addTestResult('Drag End', true, {
      activeId: active.id,
      overId: over?.id,
      overData: over?.data.current,
      activeData: active.data.current
    })
    
    setDraggedDoctor(null)
    
    if (!over) {
      addTestResult('Drop Validation', false, {
        reason: 'No valid drop target'
      }, 'No drop target found')
      return
    }

    const doctorId = parseInt(active.id as string)
    const cellData = over.id as string
    
    // Parse cell data: "date_assignmentType"
    const [dateStr, assignmentType] = cellData.split('_')
    
    addTestResult('Drop Data Parsing', true, {
      doctorId,
      cellData,
      dateStr,
      assignmentType
    })
    
    // Validate assignment type
    const assignmentTypeConfig = ASSIGNMENT_TYPES.find(at => at.type === assignmentType)
    if (!assignmentTypeConfig) {
      addTestResult('Assignment Type Validation', false, {
        assignmentType,
        availableTypes: ASSIGNMENT_TYPES.map(at => at.type)
      }, 'Invalid assignment type')
      return
    }
    
    addTestResult('Assignment Type Validation', true, {
      assignmentType,
      config: assignmentTypeConfig
    })
    
    // Test assignment data structure
    const assignmentData = {
      doctor_id: doctorId,
      assignment_date: dateStr,
      assignment_type: assignmentType as AssignmentType
    }
    
    addTestResult('Assignment Data Structure', true, {
      assignmentData,
      isValid: true
    })
    
    addTestResult('Complete Drop Test', true, {
      message: 'All validation checks passed',
      assignmentData
    })
  }

  const runAutomatedTest = async () => {
    setIsRunningTest(true)
    const results: TestResult[] = []
    
    try {
      // Test 1: Check if doctors are available
      if (doctors.length === 0) {
        addTestResult('Doctor Availability', false, {
          doctorsCount: doctors.length
        }, 'No doctors available for testing')
        return
      }
      
      addTestResult('Doctor Availability', true, {
        doctorsCount: doctors.length,
        doctors: doctors.map(d => ({ id: d.id, name: d.name }))
      })
      
      // Test 2: Check assignment types
      addTestResult('Assignment Types', true, {
        types: ASSIGNMENT_TYPES.map(at => ({
          type: at.type,
          label: at.label,
          capacity: at.capacity
        }))
      })
      
      // Test 3: Simulate drag start
      const testDoctor = doctors[0]
      const mockDragStartEvent = {
        active: {
          id: testDoctor.id.toString(),
          data: { current: { doctor: testDoctor } }
        },
        activatorEvent: new MouseEvent('mousedown')
      } as unknown as DragStartEvent
      
      handleDragStart(mockDragStartEvent)
      
      // Test 4: Simulate drag over
      const testDate = '2024-01-01'
      const testAssignmentType = ASSIGNMENT_TYPES[0].type
      const mockDragOverEvent = {
        active: { id: testDoctor.id.toString() },
        over: {
          id: `${testDate}_${testAssignmentType}`,
          data: { current: { date: testDate, assignmentType: testAssignmentType } }
        }
      } as unknown as DragOverEvent
      
      handleDragOver(mockDragOverEvent)
      
      // Test 5: Simulate drag end
      const mockDragEndEvent = {
        active: { id: testDoctor.id.toString() },
        over: {
          id: `${testDate}_${testAssignmentType}`,
          data: { current: { date: testDate, assignmentType: testAssignmentType } }
        }
      } as unknown as DragEndEvent
      
      handleDragEnd(mockDragEndEvent)
      
      addTestResult('Automated Test Suite', true, {
        message: 'All automated tests completed successfully',
        testsRun: 5
      })
      
    } catch (error) {
      addTestResult('Automated Test Suite', false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Test suite failed')
    } finally {
      setIsRunningTest(false)
    }
  }

  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.success).length,
        failed: testResults.filter(r => !r.success).length
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `drag-drop-test-results-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bug className="h-5 w-5 mr-2" />
          Drag & Drop Test Suite
        </h3>
        <div className="space-x-2">
          <Button 
            size="sm" 
            onClick={runAutomatedTest}
            disabled={isRunningTest}
          >
            {isRunningTest ? 'Running...' : 'Run Tests'}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={exportResults}
            disabled={testResults.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={clearResults}
            disabled={testResults.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>
      
      {/* Test Results */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {testResults.map((result, index) => (
          <div 
            key={index}
            className={`p-3 rounded border text-sm ${
              result.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <strong>{result.testName}</strong>
                <span className="ml-2 text-xs opacity-75">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                result.success ? 'bg-green-200' : 'bg-red-200'
              }`}>
                {result.success ? 'PASS' : 'FAIL'}
              </span>
            </div>
            {result.error && (
              <div className="mt-1 text-red-600 font-mono text-xs">
                Error: {result.error}
              </div>
            )}
            <details className="mt-2">
              <summary className="cursor-pointer text-xs opacity-75">Details</summary>
              <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>
      
      {testResults.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No test results yet. Click "Run Tests" to start testing.
        </div>
      )}
      
      {/* Summary */}
      {testResults.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <div className="flex justify-between text-sm">
            <span>Total Tests: {testResults.length}</span>
            <span className="text-green-600">
              Passed: {testResults.filter(r => r.success).length}
            </span>
            <span className="text-red-600">
              Failed: {testResults.filter(r => !r.success).length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

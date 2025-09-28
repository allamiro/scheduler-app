'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent, useDraggable, useDroppable } from '@dnd-kit/core'

// Simple draggable item
function DraggableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-4 bg-blue-500 text-white rounded cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {children}
    </div>
  )
}

// Simple droppable area
function DroppableArea({ id, children }: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`p-8 border-2 border-dashed rounded-lg ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
    >
      {children}
    </div>
  )
}

export default function SimpleDragTest() {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[${timestamp}] ${message}`)
  }

  const handleDragStart = (event: DragStartEvent) => {
    addLog(`Drag started: ${event.active.id}`)
    setDraggedItem(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    addLog(`Drag over: ${event.active.id} -> ${event.over?.id}`)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    addLog(`Drag ended: ${event.active.id} -> ${event.over?.id}`)
    setDraggedItem(null)
    
    if (event.over) {
      addLog(`✅ Drop successful: ${event.active.id} dropped on ${event.over.id}`)
    } else {
      addLog(`❌ Drop failed: No valid drop target`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Simple Drag & Drop Test</h1>

      <div className="max-w-4xl mx-auto">
        <DndContext 
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Draggable Items */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Draggable Items</h2>
              <div className="space-y-4">
                <DraggableItem id="item1">Item 1</DraggableItem>
                <DraggableItem id="item2">Item 2</DraggableItem>
                <DraggableItem id="item3">Item 3</DraggableItem>
              </div>
            </div>

            {/* Droppable Areas */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Drop Zones</h2>
              <div className="space-y-4">
                <DroppableArea id="zone1">Drop Zone 1</DroppableArea>
                <DroppableArea id="zone2">Drop Zone 2</DroppableArea>
                <DroppableArea id="zone3">Drop Zone 3</DroppableArea>
              </div>
            </div>
          </div>

          <DragOverlay>
            {draggedItem ? (
              <div className="p-4 bg-blue-500 text-white rounded cursor-grabbing">
                Dragging: {draggedItem}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Debug Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-800 text-white p-4 rounded-lg max-h-60 overflow-y-auto text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-400">No logs yet. Try dragging an item!</p>
            ) : (
              logs.map((log, index) => (
                <p key={index}>{log}</p>
              ))
            )}
          </div>
          <button 
            onClick={() => setLogs([])}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  )
}

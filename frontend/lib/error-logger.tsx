'use client'

import { useEffect } from 'react'

// Global error logging system
class ErrorLogger {
  private errors: Array<{
    timestamp: string
    type: string
    message: string
    stack?: string
    url?: string
    line?: number
    column?: number
  }> = []

  constructor() {
    // Only setup error handlers on client side
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers()
    }
  }

  private setupGlobalErrorHandlers() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError('JavaScript Error', {
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      })
    })

    // React error boundary (if needed)
    if (typeof window !== 'undefined') {
      const originalConsoleError = console.error
      console.error = (...args) => {
        this.logError('Console Error', {
          message: args.join(' ')
        })
        originalConsoleError.apply(console, args)
      }
    }
  }

  logError(type: string, details: {
    message: string
    stack?: string
    url?: string
    line?: number
    column?: number
  }) {
    const error = {
      timestamp: new Date().toISOString(),
      type,
      ...details
    }
    
    this.errors.push(error)
    console.error('🚨 Error logged:', error)
  }

  getErrors() {
    return this.errors
  }

  clearErrors() {
    this.errors = []
  }

  exportErrors() {
    const errorText = this.errors.map(error => 
      `[${error.timestamp}] ${error.type}: ${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`
    ).join('\n\n')
    
    const blob = new Blob([errorText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `frontend-errors-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// Global error logger instance
const errorLogger = new ErrorLogger()

// React component for error display
export function ErrorDisplay() {
  const errors = errorLogger.getErrors()

  if (errors.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-green-600 text-sm">
            ✅ No JavaScript errors detected
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-red-800 font-semibold">
          🚨 JavaScript Errors ({errors.length})
        </h3>
        <div className="space-x-2">
          <button
            onClick={() => errorLogger.clearErrors()}
            className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs hover:bg-red-300"
          >
            Clear
          </button>
          <button
            onClick={() => errorLogger.exportErrors()}
            className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs hover:bg-red-300"
          >
            Export
          </button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {errors.map((error, index) => (
          <div key={index} className="bg-white rounded border p-2 text-xs">
            <div className="font-semibold text-red-700">
              [{error.timestamp}] {error.type}
            </div>
            <div className="text-red-600 mt-1">
              {error.message}
            </div>
            {error.url && (
              <div className="text-gray-500 mt-1">
                {error.url}:{error.line}:{error.column}
              </div>
            )}
            {error.stack && (
              <details className="mt-1">
                <summary className="cursor-pointer text-gray-500">Stack trace</summary>
                <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Hook to get error logger
export function useErrorLogger() {
  return errorLogger
}

// Export the error logger for global access
export { errorLogger }

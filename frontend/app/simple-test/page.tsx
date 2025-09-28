'use client'

import { useState, useEffect } from 'react'

export default function SimpleTestPage() {
  const [status, setStatus] = useState('Loading...')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    // Test basic functionality
    try {
      setStatus('Testing basic React functionality...')
      
      // Test localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('test', 'working')
        const testValue = localStorage.getItem('test')
        if (testValue !== 'working') {
          throw new Error('localStorage not working')
        }
        localStorage.removeItem('test')
      }
      
      setStatus('Testing API connection...')
      
      // Test API connection
      fetch('http://localhost:8001/health')
        .then(response => response.json())
        .then(data => {
          if (data.status === 'healthy') {
            setStatus('✅ All tests passed! Application should work.')
          } else {
            throw new Error('API health check failed')
          }
        })
        .catch(error => {
          setErrors(prev => [...prev, `API Error: ${error.message}`])
          setStatus('❌ API connection failed')
        })
        
    } catch (error) {
      setErrors(prev => [...prev, `JavaScript Error: ${error instanceof Error ? error.message : 'Unknown error'}`])
      setStatus('❌ JavaScript error occurred')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Simple Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="text-lg">{status}</div>
        </div>
        
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Errors</h2>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="bg-white rounded border p-2 text-red-700">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Next Steps</h2>
          <div className="text-blue-700 space-y-2">
            <p>If this page works but the main dashboard doesn't, the issue is likely:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Swapy library compatibility issue</li>
              <li>Error logger causing problems</li>
              <li>Complex component interaction issue</li>
            </ul>
            <p className="mt-4">
              <a href="/dashboard" className="text-blue-600 underline">
                Try the main dashboard →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

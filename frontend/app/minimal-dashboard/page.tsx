'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Calendar, Users, LogOut } from 'lucide-react'

export default function MinimalDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const userData = await apiClient.getCurrentUser()
      setUser(userData)
      
    } catch (error) {
      console.error('Failed to load data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      // Don't redirect to login automatically in this test
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    apiClient.clearToken()
    // Don't redirect in this test
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Duty Scheduler (Minimal)</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{user?.username || 'No user'} ({user?.role || 'No role'})</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                <LogOut className="h-4 w-4 mr-2 inline" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Minimal Dashboard Test
          </h2>
          
          <div className="space-y-4">
            <div>
              <strong>User Info:</strong>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>Status:</strong>
              <p className="text-green-600">✅ Minimal dashboard loaded successfully!</p>
            </div>
            
            <div>
              <strong>Next Steps:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>If this works, the issue is with Swapy or complex components</li>
                <li>If this fails, the issue is with basic authentication/API</li>
                <li>
                  <a href="/dashboard" className="text-blue-600 underline">
                    Try the full dashboard →
                  </a>
                </li>
                <li>
                  <a href="/simple-test" className="text-blue-600 underline">
                    Try the simple test page →
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

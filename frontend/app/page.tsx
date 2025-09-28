'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Try to get current user to check if already logged in
    const checkAuth = async () => {
      try {
        await apiClient.getCurrentUser()
        router.push('/dashboard')
      } catch {
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

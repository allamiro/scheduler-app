import { 
  User, 
  Doctor, 
  Schedule, 
  Assignment, 
  PublishedSchedule, 
  LoginCredentials, 
  AuthResponse,
  AssignmentType,
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

class ApiClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    // Persist token to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      
      // Handle different error formats
      let errorMessage = `HTTP ${response.status}`
      
      if (error.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail
        } else if (Array.isArray(error.detail)) {
          // Handle validation errors
          errorMessage = error.detail.map((err: any) => err.msg || err.message || 'Validation error').join(', ')
        } else if (typeof error.detail === 'object') {
          errorMessage = error.detail.message || JSON.stringify(error.detail)
        }
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }))
      throw new Error(error.detail || 'Login failed')
    }

    const data = await response.json()
    this.setToken(data.access_token)
    return data
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/auth/me')
  }

  // Doctor endpoints
  async getDoctors(): Promise<Doctor[]> {
    return this.request<Doctor[]>('/api/doctors/')
  }

  async createDoctor(doctor: Omit<Doctor, 'id' | 'is_active'>): Promise<Doctor> {
    return this.request<Doctor>('/api/doctors/', {
      method: 'POST',
      body: JSON.stringify(doctor),
    })
  }

  async updateDoctor(id: number, doctor: Partial<Doctor>): Promise<Doctor> {
    return this.request<Doctor>(`/api/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctor),
    })
  }

  async deleteDoctor(id: number): Promise<void> {
    await this.request(`/api/doctors/${id}`, {
      method: 'DELETE',
    })
  }

  async clearDoctorAssignments(id: number): Promise<{ message: string; cleared_count: number }> {
    return this.request<{ message: string; cleared_count: number }>(`/api/doctors/${id}/assignments`, {
      method: 'DELETE',
    })
  }

  // Schedule endpoints
  async getSchedules(): Promise<Schedule[]> {
    return this.request<Schedule[]>('/api/schedules/')
  }

  async getScheduleByWeek(weekStartDate: string): Promise<Schedule> {
    return this.request<Schedule>(`/api/schedules/week/${weekStartDate}`)
  }

  async createSchedule(weekStartDate: string): Promise<Schedule> {
    return this.request<Schedule>('/api/schedules/', {
      method: 'POST',
      body: JSON.stringify({ week_start_date: weekStartDate }),
    })
  }

  async createAssignment(
    scheduleId: number, 
    assignment: {
      doctor_id: number
      assignment_date: string
      assignment_type: AssignmentType
    }
  ): Promise<Assignment> {
    return this.request<Assignment>(`/api/schedules/${scheduleId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(assignment),
    })
  }

  async deleteAssignment(scheduleId: number, assignmentId: number): Promise<void> {
    await this.request(`/api/schedules/${scheduleId}/assignments/${assignmentId}`, {
      method: 'DELETE',
    })
  }

  // Published schedule endpoints
  async publishSchedule(scheduleId: number): Promise<PublishedSchedule> {
    return this.request<PublishedSchedule>(`/api/published/${scheduleId}/publish`, {
      method: 'POST',
    })
  }

  async unpublishSchedule(scheduleId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/published/${scheduleId}/unpublish`, {
      method: 'DELETE',
    })
  }

  async getPublishedSchedules(): Promise<PublishedSchedule[]> {
    return this.request<PublishedSchedule[]>('/api/published')
  }

      async getPublishedSchedule(slug: string): Promise<{ html_content: string }> {
        return this.request<{ html_content: string }>(`/api/published/${slug}`)
      }

      // User management endpoints
      async getUsers(): Promise<User[]> {
        return this.request<User[]>('/api/users/')
      }

      async createUser(user: CreateUserRequest): Promise<User> {
        return this.request<User>('/api/users/', {
          method: 'POST',
          body: JSON.stringify(user),
        })
      }

      async updateUser(id: number, user: UpdateUserRequest): Promise<User> {
        return this.request<User>(`/api/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(user),
        })
      }

      async deleteUser(id: number): Promise<void> {
        await this.request(`/api/users/${id}`, {
          method: 'DELETE',
        })
      }

  // Password change endpoint
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    await this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    })
  }
}

export const apiClient = new ApiClient()

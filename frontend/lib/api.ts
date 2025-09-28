import { 
  User, 
  Doctor, 
  Schedule, 
  Assignment, 
  PublishedSchedule, 
  LoginCredentials, 
  AuthResponse,
  AssignmentType 
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
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: formData,
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

  async getPublishedSchedules(): Promise<PublishedSchedule[]> {
    return this.request<PublishedSchedule[]>('/api/published')
  }

  async getPublishedSchedule(slug: string): Promise<{ html_content: string }> {
    return this.request<{ html_content: string }>(`/api/published/${slug}`)
  }
}

export const apiClient = new ApiClient()

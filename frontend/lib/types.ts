export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'editor'
  is_active: boolean
}

export interface Doctor {
  id: number
  name: string
  email?: string
  phone?: string
  is_active: boolean
}

export interface Assignment {
  id: number
  doctor_id: number
  assignment_date: string
  assignment_type: AssignmentType
  doctor_name: string
}

export interface Schedule {
  id: number
  week_start_date: string
  week_end_date: string
  assignments: Assignment[]
}

export interface PublishedSchedule {
  id: number
  slug: string
  schedule_id: number
  published_at: string
  week_start_date: string
  week_end_date: string
}

export type AssignmentType = 
  | 'ultrasound_morning'
  | 'ultrasound_afternoon'
  | 'xray_morning'
  | 'xray_afternoon'
  | 'ct_scan'
  | 'mri'
  | 'duty'

export interface AssignmentTypeConfig {
  type: AssignmentType
  label: string
  capacity: number
}

export const ASSIGNMENT_TYPES: AssignmentTypeConfig[] = [
  { type: 'ultrasound_morning', label: 'ULTRASOUND Morning', capacity: 3 },
  { type: 'ultrasound_afternoon', label: 'ULTRASOUND Afternoon', capacity: 3 },
  { type: 'xray_morning', label: 'X ray Morning', capacity: 2 },
  { type: 'xray_afternoon', label: 'X ray Afternoon', capacity: 2 },
  { type: 'ct_scan', label: 'CT-SCAN', capacity: 1 },
  { type: 'mri', label: 'MRI', capacity: 1 },
  { type: 'duty', label: 'Duty', capacity: 1 },
]

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

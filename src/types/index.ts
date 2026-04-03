export type UserRole = 'jobseeker' | 'employer' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface JobListing {
  id: string
  employer_id: string
  title: string
  company: string
  location: string
  type: 'full_time' | 'part_time' | 'contract' | 'remote'
  salary_min?: number
  salary_max?: number
  description: string
  requirements: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  job_id: string
  applicant_id: string
  status: 'pending' | 'reviewing' | 'interviewed' | 'offered' | 'rejected'
  cover_letter?: string
  resume_url?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name: string
  headline?: string
  bio?: string
  location?: string
  website?: string
  linkedin_url?: string
  github_url?: string
  skills: string[]
  avatar_url?: string
}

export type UserRole = 'client' | 'professional' | 'admin'

export interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  value_type: 'session' | 'monthly'
  max_attendees: number
}

export interface Professional {
  id: string
  user_id: string | null
  name: string
  specialty: string | null
  bio: string | null
  avatar_url: string | null
}

export interface Schedule {
  id: string
  professional_id: string
  start_time: string
  end_time: string
}

export interface Partnership {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Client {
  id: string
  user_id?: string | null
  name: string
  email: string // Now stores CPF as per requirement
  phone?: string | null
  partnership_id?: string | null
  is_active: boolean
  partnerships?: Partnership | null
  profile_picture_url?: string | null
  general_assessment?: Record<string, any> | null
}

export interface NoteEntry {
  date: string
  professional_id?: string
  professional_name: string
  content: string
}

export interface Appointment {
  id: string
  client_id: string
  professional_id: string
  service_id: string
  schedule_id: string
  status: string
  notes: NoteEntry[] | null
  created_at: string
  clients: Client
  professionals: Professional
  services: Service
  schedules: Schedule
}

export interface Package {
  id: string
  name: string
  description: string | null
  service_id: string
  session_count: number
  price: number
}

export interface ClientPackage {
  id: string
  client_id: string
  package_id: string
  purchase_date: string
  sessions_remaining: number
}

export interface ClientPackageWithDetails extends ClientPackage {
  packages: Package
}

export interface FinancialRecord {
  id: string
  client_id: string
  professional_id: string
  appointment_id: string | null
  client_package_id: string | null
  amount: number
  payment_date: string
  description: string | null
}

export interface RecurringAvailability {
  id: string
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
  created_at: string
  service_ids: string[] | null
}

export interface AvailabilityOverride {
  id: string
  professional_id: string
  override_date: string
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
  service_ids: string[] | null
}

export interface PartnershipDiscount {
  id: string
  partnership_id: string
  service_id: string | null
  discount_percentage: number
  created_at: string
}

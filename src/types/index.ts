export interface Service {
  id: string
  name: string
  description: string | null
}

export interface Professional {
  id: string
  name: string
  specialty: string | null
  avatar_url: string | null
}

export interface Schedule {
  id: string
  professional_id: string
  start_time: string
  end_time: string
  is_booked: boolean
}

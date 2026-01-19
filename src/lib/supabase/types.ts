// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string
          client_package_id: string | null
          created_at: string
          id: string
          is_recurring: boolean | null
          notes: Json | null
          professional_id: string
          schedule_id: string
          service_id: string
          status: Database['public']['Enums']['appointment_status']
        }
        Insert: {
          client_id: string
          client_package_id?: string | null
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          notes?: Json | null
          professional_id: string
          schedule_id: string
          service_id: string
          status?: Database['public']['Enums']['appointment_status']
        }
        Update: {
          client_id?: string
          client_package_id?: string | null
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          notes?: Json | null
          professional_id?: string
          schedule_id?: string
          service_id?: string
          status?: Database['public']['Enums']['appointment_status']
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_client_package_id_fkey'
            columns: ['client_package_id']
            isOneToOne: false
            referencedRelation: 'client_packages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_schedule_id_fkey'
            columns: ['schedule_id']
            isOneToOne: false
            referencedRelation: 'schedules'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
        ]
      }
      client_packages: {
        Row: {
          client_id: string
          id: string
          package_id: string
          purchase_date: string
          sessions_remaining: number
        }
        Insert: {
          client_id: string
          id?: string
          package_id: string
          purchase_date?: string
          sessions_remaining: number
        }
        Update: {
          client_id?: string
          id?: string
          package_id?: string
          purchase_date?: string
          sessions_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: 'client_packages_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'client_packages_package_id_fkey'
            columns: ['package_id']
            isOneToOne: false
            referencedRelation: 'packages'
            referencedColumns: ['id']
          },
        ]
      }
      client_subscriptions: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          service_id: string
          start_date: string
          status: Database['public']['Enums']['subscription_status']
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          service_id: string
          start_date: string
          status?: Database['public']['Enums']['subscription_status']
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          service_id?: string
          start_date?: string
          status?: Database['public']['Enums']['subscription_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'client_subscriptions_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'client_subscriptions_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
        ]
      }
      clients: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string
          general_assessment: Json | null
          id: string
          is_active: boolean
          name: string
          partnership_id: string | null
          phone: string | null
          profile_picture_url: string | null
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email: string
          general_assessment?: Json | null
          id?: string
          is_active?: boolean
          name: string
          partnership_id?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string
          general_assessment?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          partnership_id?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'clients_partnership_id_fkey'
            columns: ['partnership_id']
            isOneToOne: false
            referencedRelation: 'partnerships'
            referencedColumns: ['id']
          },
        ]
      }
      financial_records: {
        Row: {
          amount: number
          appointment_id: string | null
          client_id: string
          client_package_id: string | null
          created_at: string
          description: string | null
          id: string
          payment_date: string
          payment_method: string | null
          professional_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          client_id: string
          client_package_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          professional_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          client_id?: string
          client_package_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'financial_records_appointment_id_fkey'
            columns: ['appointment_id']
            isOneToOne: false
            referencedRelation: 'appointments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_records_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_records_client_package_id_fkey'
            columns: ['client_package_id']
            isOneToOne: false
            referencedRelation: 'client_packages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_records_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          service_id: string | null
          session_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          service_id?: string | null
          session_count: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          service_id?: string | null
          session_count?: number
        }
        Relationships: [
          {
            foreignKeyName: 'packages_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
        ]
      }
      partnership_discounts: {
        Row: {
          created_at: string
          discount_percentage: number
          id: string
          partnership_id: string
          service_id: string | null
        }
        Insert: {
          created_at?: string
          discount_percentage: number
          id?: string
          partnership_id: string
          service_id?: string | null
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          id?: string
          partnership_id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'partnership_discounts_partnership_id_fkey'
            columns: ['partnership_id']
            isOneToOne: false
            referencedRelation: 'partnerships'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'partnership_discounts_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
        ]
      }
      partnerships: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      professional_availability_overrides: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_available: boolean
          override_date: string
          professional_id: string
          service_ids: string[] | null
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_available?: boolean
          override_date: string
          professional_id: string
          service_ids?: string[] | null
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_available?: boolean
          override_date?: string
          professional_id?: string
          service_ids?: string[] | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: 'professional_availability_overrides_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      professional_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          professional_id: string
          related_entity_id: string | null
          type: Database['public']['Enums']['notification_type']
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          professional_id: string
          related_entity_id?: string | null
          type: Database['public']['Enums']['notification_type']
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          professional_id?: string
          related_entity_id?: string | null
          type?: Database['public']['Enums']['notification_type']
        }
        Relationships: [
          {
            foreignKeyName: 'professional_notifications_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      professional_recurring_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          professional_id: string
          service_ids: string[] | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          professional_id: string
          service_ids?: string[] | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          professional_id?: string
          service_ids?: string[] | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: 'professional_recurring_availability_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      professional_services: {
        Row: {
          professional_id: string
          service_id: string
        }
        Insert: {
          professional_id: string
          service_id: string
        }
        Update: {
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'professional_services_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'professional_services_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
        ]
      }
      professionals: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          specialty: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          specialty?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          specialty?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: Database['public']['Enums']['user_role']
        }
        Insert: {
          created_at?: string
          id: string
          role: Database['public']['Enums']['user_role']
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database['public']['Enums']['user_role']
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          end_time: string
          id: string
          professional_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          professional_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          professional_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schedules_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          max_attendees: number
          name: string
          price: number
          value_type: Database['public']['Enums']['service_value_type']
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_attendees?: number
          name: string
          price: number
          value_type?: Database['public']['Enums']['service_value_type']
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_attendees?: number
          name?: string
          price?: number
          value_type?: Database['public']['Enums']['service_value_type']
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_appointment:
        | {
            Args: {
              p_client_id: string
              p_client_package_id?: string
              p_schedule_id: string
              p_service_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_client_id: string
              p_client_package_id?: string
              p_is_recurring?: boolean
              p_schedule_id: string
              p_service_id: string
            }
            Returns: string
          }
      book_appointment_dynamic: {
        Args: {
          p_client_id: string
          p_client_package_id?: string
          p_is_recurring?: boolean
          p_professional_id: string
          p_service_id: string
          p_start_time: string
        }
        Returns: string
      }
      book_recurring_appointment_series: {
        Args: {
          p_client_id: string
          p_client_package_id?: string
          p_occurrences?: number
          p_professional_id: string
          p_service_id: string
          p_start_time: string
        }
        Returns: undefined
      }
      cancel_appointment: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      complete_appointment: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      get_annual_comparative: {
        Args: {
          p_partnership_id?: string
          p_professional_id?: string
          p_service_id?: string
        }
        Returns: {
          month: string
          total_appointments: number
          total_revenue: number
        }[]
      }
      get_available_dates:
        | {
            Args: {
              p_end_date: string
              p_professional_id: string
              p_service_id: string
              p_start_date: string
            }
            Returns: {
              available_date: string
            }[]
          }
        | {
            Args: {
              p_end_date: string
              p_professional_id: string
              p_service_id: string
              p_start_date: string
            }
            Returns: {
              available_date: string
            }[]
          }
      get_available_dates_dynamic: {
        Args: {
          p_end_date: string
          p_professional_id: string
          p_service_id: string
          p_start_date: string
        }
        Returns: {
          available_date: string
        }[]
      }
      get_available_professionals_at_time_dynamic: {
        Args: { p_service_id: string; p_start_time: string }
        Returns: {
          avatar_url: string
          id: string
          name: string
          specialty: string
        }[]
      }
      get_available_professionals_for_service_at_time: {
        Args: { p_service_id: string; p_start_time: string }
        Returns: {
          avatar_url: string
          id: string
          name: string
          specialty: string
        }[]
      }
      get_available_slots_dynamic: {
        Args: {
          p_end_date: string
          p_professional_id: string
          p_service_id: string
          p_start_date: string
        }
        Returns: {
          current_count: number
          end_time: string
          max_capacity: number
          schedule_id: string
          start_time: string
        }[]
      }
      get_available_slots_for_service: {
        Args: {
          p_end_date: string
          p_professional_id: string
          p_service_id: string
          p_start_date: string
        }
        Returns: {
          current_count: number
          end_time: string
          id: string
          max_capacity: number
          professional_id: string
          start_time: string
        }[]
      }
      get_clients_with_birthday_this_week: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          birth_date: string
          email: string
          id: string
          name: string
          phone: string
        }[]
      }
      get_kpi_metrics: {
        Args: {
          end_date: string
          p_partnership_id?: string
          p_professional_id?: string
          p_service_id?: string
          start_date: string
        }
        Returns: {
          average_ticket: number
          cancellation_rate: number
          cancelled_appointments: number
          completed_appointments: number
          prev_average_ticket: number
          prev_cancellation_rate: number
          prev_cancelled_appointments: number
          prev_completed_appointments: number
          prev_retention_rate: number
          prev_total_appointments: number
          prev_total_revenue: number
          retention_rate: number
          total_appointments: number
          total_revenue: number
        }[]
      }
      get_partnership_performance: {
        Args: {
          end_date: string
          p_partnership_id?: string
          p_professional_id?: string
          p_service_id?: string
          start_date: string
        }
        Returns: {
          client_count: number
          partnership_name: string
          total_revenue: number
        }[]
      }
      get_service_performance: {
        Args: {
          end_date: string
          p_partnership_id?: string
          p_professional_id?: string
          p_service_id?: string
          start_date: string
        }
        Returns: {
          count: number
          service_name: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      reschedule_appointment: {
        Args: { p_appointment_id: string; p_new_schedule_id: string }
        Returns: undefined
      }
      reschedule_appointment_dynamic: {
        Args: {
          p_appointment_id: string
          p_new_professional_id: string
          p_new_start_time: string
        }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status:
        | 'scheduled'
        | 'confirmed'
        | 'completed'
        | 'cancelled'
        | 'no_show'
      notification_type:
        | 'missing_notes'
        | 'schedule_changed'
        | 'admin_override'
        | 'new_service'
        | 'new_appointment'
        | 'rescheduled_appointment'
        | 'cancelled_appointment'
        | 'package_renewal'
      service_value_type: 'session' | 'monthly'
      subscription_status: 'active' | 'paused' | 'cancelled' | 'expired'
      user_role: 'client' | 'professional' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        'scheduled',
        'confirmed',
        'completed',
        'cancelled',
        'no_show',
      ],
      notification_type: [
        'missing_notes',
        'schedule_changed',
        'admin_override',
        'new_service',
        'new_appointment',
        'rescheduled_appointment',
        'cancelled_appointment',
        'package_renewal',
      ],
      service_value_type: ['session', 'monthly'],
      subscription_status: ['active', 'paused', 'cancelled', 'expired'],
      user_role: ['client', 'professional', 'admin'],
    },
  },
} as const

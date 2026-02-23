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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_id: string
          client_package_id: string | null
          created_at: string
          discount_amount: number | null
          id: string
          is_recurring: boolean | null
          notes: Json | null
          professional_id: string
          schedule_id: string
          service_id: string
          status: Database["public"]["Enums"]["appointment_status"]
        }
        Insert: {
          client_id: string
          client_package_id?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          is_recurring?: boolean | null
          notes?: Json | null
          professional_id: string
          schedule_id: string
          service_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Update: {
          client_id?: string
          client_package_id?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          is_recurring?: boolean | null
          notes?: Json | null
          professional_id?: string
          schedule_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_clients_with_partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_package_id_fkey"
            columns: ["client_package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_professionals_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services_with_children"
            referencedColumns: ["id"]
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
          status: string
        }
        Insert: {
          client_id: string
          id?: string
          package_id: string
          purchase_date?: string
          sessions_remaining: number
          status?: string
        }
        Update: {
          client_id?: string
          id?: string
          package_id?: string
          purchase_date?: string
          sessions_remaining?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_clients_with_partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_services_with_children"
            referencedColumns: ["package_id"]
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
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_plan_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          service_id: string
          start_date: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_plan_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          service_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_clients_with_partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services_with_children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "v_services_with_children"
            referencedColumns: ["subscription_plan_id"]
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
            foreignKeyName: "clients_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "v_partnerships_list"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          amount: number
          appointment_id: string | null
          client_id: string
          client_package_id: string | null
          client_subscription_id: string | null
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
          client_subscription_id?: string | null
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
          client_subscription_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "v_appointments_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_clients_with_partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_client_package_id_fkey"
            columns: ["client_package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_client_subscription_id_fkey"
            columns: ["client_subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_professionals_list"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          service_id: string | null
          session_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          service_id?: string | null
          session_count: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          service_id?: string | null
          session_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services_with_children"
            referencedColumns: ["id"]
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
            foreignKeyName: "partnership_discounts_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_discounts_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "v_partnerships_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_discounts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_discounts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services_with_children"
            referencedColumns: ["id"]
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
            foreignKeyName: "professional_availability_overrides_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_availability_overrides_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_professionals_list"
            referencedColumns: ["id"]
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
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          professional_id: string
          related_entity_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          professional_id?: string
          related_entity_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "professional_notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_professionals_list"
            referencedColumns: ["id"]
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
            foreignKeyName: "professional_recurring_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_recurring_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_professionals_list"
            referencedColumns: ["id"]
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
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_professionals_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services_with_children"
            referencedColumns: ["id"]
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
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
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
            foreignKeyName: "schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_professionals_list"
            referencedColumns: ["id"]
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
          value_type: Database["public"]["Enums"]["service_value_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_attendees?: number
          name: string
          price: number
          value_type?: Database["public"]["Enums"]["service_value_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_attendees?: number
          name?: string
          price?: number
          value_type?: Database["public"]["Enums"]["service_value_type"]
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          service_id: string
          sessions_per_week: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          service_id: string
          sessions_per_week?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          service_id?: string
          sessions_per_week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_plans_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services_with_children"
            referencedColumns: ["id"]
          },
        ]
      }
      time_tracking: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          date: string
          id: string
          professional_id: string
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          professional_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_professionals_list"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_appointments_with_details: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_package_id: string | null
          created_at: string | null
          discount_amount: number | null
          duration_minutes: number | null
          effective_price: number | null
          end_time: string | null
          id: string | null
          max_attendees: number | null
          notes: Json | null
          price: number | null
          professional_id: string | null
          professional_name: string | null
          schedule_id: string | null
          service_id: string | null
          service_name: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          value_type: Database["public"]["Enums"]["service_value_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_clients_with_partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_package_id_fkey"
            columns: ["client_package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_professionals_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services_with_children"
            referencedColumns: ["id"]
          },
        ]
      }
      v_clients_with_partnerships: {
        Row: {
          birth_date: string | null
          created_at: string | null
          email: string | null
          general_assessment: Json | null
          id: string | null
          is_active: boolean | null
          name: string | null
          partnership_description: string | null
          partnership_id: string | null
          partnership_name: string | null
          phone: string | null
          profile_picture_url: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "v_partnerships_list"
            referencedColumns: ["id"]
          },
        ]
      }
      v_partnerships_list: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      v_professionals_list: {
        Row: {
          id: string | null
          is_active: boolean | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_services_with_children: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string | null
          max_attendees: number | null
          name: string | null
          package_description: string | null
          package_id: string | null
          package_name: string | null
          package_price: number | null
          price: number | null
          session_count: number | null
          sessions_per_week: number | null
          subscription_plan_description: string | null
          subscription_plan_id: string | null
          subscription_plan_name: string | null
          subscription_plan_price: number | null
          value_type: Database["public"]["Enums"]["service_value_type"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      book_appointment: {
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
      check_daily_birthdays: { Args: never; Returns: undefined }
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
          current_occupancy: number
          id: string
          max_capacity: number
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
      get_clients_with_birthday_this_week_safe: {
        Args: never
        Returns: {
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
        }[]
        SetofOptions: {
          from: "*"
          to: "clients"
          isOneToOne: false
          isSetofReturn: true
        }
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
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { uid: string }; Returns: boolean }
      is_admin_simple: { Args: { p_user?: string }; Returns: boolean }
      process_missing_notes_notifications: { Args: never; Returns: undefined }
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
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      notification_type:
        | "missing_notes"
        | "schedule_changed"
        | "admin_override"
        | "new_service"
        | "new_appointment"
        | "rescheduled_appointment"
        | "cancelled_appointment"
        | "package_renewal"
      service_value_type: "session" | "monthly"
      subscription_status: "active" | "paused" | "cancelled" | "expired"
      user_role: "client" | "professional" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      notification_type: [
        "missing_notes",
        "schedule_changed",
        "admin_override",
        "new_service",
        "new_appointment",
        "rescheduled_appointment",
        "cancelled_appointment",
        "package_renewal",
      ],
      service_value_type: ["session", "monthly"],
      subscription_status: ["active", "paused", "cancelled", "expired"],
      user_role: ["client", "professional", "admin"],
    },
  },
} as const


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains constraints, RLS policies, functions, triggers,
// indexes and materialized views not present in the type definitions above.

// --- CONSTRAINTS ---
// Table: admins
//   PRIMARY KEY admins_pkey: PRIMARY KEY (user_id)
//   FOREIGN KEY admins_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: appointments
//   FOREIGN KEY appointments_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
//   FOREIGN KEY appointments_client_package_id_fkey: FOREIGN KEY (client_package_id) REFERENCES client_packages(id) ON DELETE SET NULL
//   PRIMARY KEY appointments_pkey: PRIMARY KEY (id)
//   FOREIGN KEY appointments_professional_id_fkey: FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE RESTRICT
//   FOREIGN KEY appointments_schedule_id_fkey: FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
//   FOREIGN KEY appointments_service_id_fkey: FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
// Table: client_packages
//   FOREIGN KEY client_packages_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
//   FOREIGN KEY client_packages_package_id_fkey: FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
//   PRIMARY KEY client_packages_pkey: PRIMARY KEY (id)
//   CHECK client_packages_status_check: CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'completed'::text])))
// Table: client_subscriptions
//   FOREIGN KEY client_subscriptions_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
//   PRIMARY KEY client_subscriptions_pkey: PRIMARY KEY (id)
//   FOREIGN KEY client_subscriptions_service_id_fkey: FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
//   FOREIGN KEY client_subscriptions_subscription_plan_id_fkey: FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id)
// Table: clients
//   UNIQUE clients_email_key: UNIQUE (email)
//   FOREIGN KEY clients_partnership_id_fkey: FOREIGN KEY (partnership_id) REFERENCES partnerships(id) ON DELETE SET NULL
//   PRIMARY KEY clients_pkey: PRIMARY KEY (id)
//   FOREIGN KEY clients_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
//   UNIQUE clients_user_id_key: UNIQUE (user_id)
// Table: financial_records
//   FOREIGN KEY financial_records_appointment_id_fkey: FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
//   FOREIGN KEY financial_records_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
//   FOREIGN KEY financial_records_client_package_id_fkey: FOREIGN KEY (client_package_id) REFERENCES client_packages(id) ON DELETE SET NULL
//   FOREIGN KEY financial_records_client_subscription_id_fkey: FOREIGN KEY (client_subscription_id) REFERENCES client_subscriptions(id)
//   PRIMARY KEY financial_records_pkey: PRIMARY KEY (id)
//   FOREIGN KEY financial_records_professional_id_fkey: FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE RESTRICT
// Table: packages
//   PRIMARY KEY packages_pkey: PRIMARY KEY (id)
//   FOREIGN KEY packages_service_id_fkey: FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
// Table: partnership_discounts
//   CHECK partnership_discounts_discount_percentage_check: CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric)))
//   FOREIGN KEY partnership_discounts_partnership_id_fkey: FOREIGN KEY (partnership_id) REFERENCES partnerships(id) ON DELETE CASCADE
//   UNIQUE partnership_discounts_partnership_id_service_id_key: UNIQUE (partnership_id, service_id)
//   PRIMARY KEY partnership_discounts_pkey: PRIMARY KEY (id)
//   FOREIGN KEY partnership_discounts_service_id_fkey: FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
// Table: partnerships
//   UNIQUE partnerships_name_key: UNIQUE (name)
//   PRIMARY KEY partnerships_pkey: PRIMARY KEY (id)
// Table: professional_availability_overrides
//   UNIQUE professional_availability_ove_professional_id_override_date_key: UNIQUE (professional_id, override_date, start_time, end_time)
//   PRIMARY KEY professional_availability_overrides_pkey: PRIMARY KEY (id)
//   FOREIGN KEY professional_availability_overrides_professional_id_fkey: FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
// Table: professional_notifications
//   PRIMARY KEY professional_notifications_pkey: PRIMARY KEY (id)
//   FOREIGN KEY professional_notifications_professional_id_fkey: FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
// Table: professional_recurring_availability
//   UNIQUE professional_recurring_availa_professional_id_day_of_week_s_key: UNIQUE (professional_id, day_of_week, start_time, end_time)
//   CHECK professional_recurring_availability_day_check: CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
//   PRIMARY KEY professional_recurring_availability_pkey: PRIMARY KEY (id)
//   FOREIGN KEY professional_recurring_availability_professional_id_fkey: FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
// Table: professional_services
//   PRIMARY KEY professional_services_pkey: PRIMARY KEY (professional_id, service_id)
//   FOREIGN KEY professional_services_professional_id_fkey: FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
//   FOREIGN KEY professional_services_service_id_fkey: FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
// Table: professionals
//   PRIMARY KEY professionals_pkey: PRIMARY KEY (id)
//   FOREIGN KEY professionals_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
//   UNIQUE professionals_user_id_key: UNIQUE (user_id)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: schedules
//   PRIMARY KEY schedules_pkey: PRIMARY KEY (id)
//   FOREIGN KEY schedules_professional_id_fkey: FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE RESTRICT
//   UNIQUE schedules_professional_id_start_time_key: UNIQUE (professional_id, start_time)
// Table: services
//   PRIMARY KEY services_pkey: PRIMARY KEY (id)
// Table: subscription_plans
//   PRIMARY KEY subscription_plans_pkey: PRIMARY KEY (id)
//   FOREIGN KEY subscription_plans_service_id_fkey: FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
// Table: time_tracking
//   PRIMARY KEY time_tracking_pkey: PRIMARY KEY (id)
//   FOREIGN KEY time_tracking_professional_id_fkey: FOREIGN KEY (professional_id) REFERENCES professionals(id)
// Table: user_roles
//   PRIMARY KEY user_roles_pkey: PRIMARY KEY (user_id)
//   CHECK user_roles_role_check: CHECK ((role = ANY (ARRAY['admin'::text, 'user'::text])))
//   FOREIGN KEY user_roles_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE

// --- ROW LEVEL SECURITY POLICIES ---
// Table: admins
//   Policy "Admins can view admins" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
// Table: appointments
//   Policy "Admins full access appointments" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Admins read all appointments" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ( SELECT is_admin() AS is_admin)
//   Policy "Clients view own appointments" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (client_id IN ( SELECT clients.id
//               FROM clients
//              WHERE (clients.user_id = auth.uid())))
//   Policy "Professionals update own appointments" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() IN ( SELECT professionals.user_id
//               FROM professionals
//              WHERE (professionals.id = appointments.professional_id)))
//   Policy "Professionals view own appointments" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() IN ( SELECT professionals.user_id
//               FROM professionals
//              WHERE (professionals.id = appointments.professional_id)))
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_full_access_appointments" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin(( SELECT auth.uid() AS uid))
//     WITH CHECK: is_admin(( SELECT auth.uid() AS uid))
//   Policy "admin_master_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'admin'::text, 'professional'::text]))
//   Policy "admin_master_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'admin'::text, 'professional'::text]))
//   Policy "admin_master_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'admin'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'admin'::text, 'professional'::text]))
//   Policy "appointments_admin_bypass" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (( SELECT profiles.role
//               FROM profiles
//              WHERE (profiles.id = auth.uid())) = 'admin'::user_role)
//     WITH CHECK: (( SELECT profiles.role
//                    FROM profiles
//                   WHERE (profiles.id = auth.uid())) = 'admin'::user_role)
//   Policy "appointments_professionals_update_notes" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (( SELECT profiles.role
//               FROM profiles
//              WHERE (profiles.id = auth.uid())) = 'professional'::user_role)
//     WITH CHECK: ((( SELECT profiles.role
//                    FROM profiles
//                   WHERE (profiles.id = auth.uid())) = 'professional'::user_role) AND (NOT (id IS DISTINCT FROM id)) AND (NOT (client_id IS DISTINCT FROM client_id)) AND (NOT (professional_id IS DISTINCT FROM professional_id)) AND (NOT (service_id IS DISTINCT FROM service_id)) AND (NOT (schedule_id IS DISTINCT FROM schedule_id)) AND (NOT (client_package_id IS DISTINCT FROM client_package_id)) AND (NOT (created_at IS DISTINCT FROM created_at)) AND (NOT (status IS DISTINCT FROM status)) AND (NOT (is_recurring IS DISTINCT FROM is_recurring)) AND (NOT (discount_amount IS DISTINCT FROM discount_amount)))
//   Policy "temp_anyone_read_all_appointments" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "temp_anyone_read_appointments" (SELECT, PERMISSIVE) roles={anon,authenticated}
//     USING: true
//   Policy "temp_emergency_read_all_appointments" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: client_packages
//   Policy "Admins full access client_packages" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "master_or_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
// Table: client_subscriptions
//   Policy "Admins full access client_subscriptions" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "master_or_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
// Table: clients
//   Policy "Admins full access clients" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Clients view own record" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "Professionals view clients" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM professionals
//              WHERE (professionals.user_id = auth.uid())))
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "clients_admin_bypass" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (( SELECT profiles.role
//               FROM profiles
//              WHERE (profiles.id = auth.uid())) = 'admin'::user_role)
//     WITH CHECK: (( SELECT profiles.role
//                    FROM profiles
//                   WHERE (profiles.id = auth.uid())) = 'admin'::user_role)
//   Policy "pro_master_can_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "pro_master_can_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "pro_master_can_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "pro_master_can_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "temp_anyone_read_all" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "temp_anyone_read_clients" (SELECT, PERMISSIVE) roles={anon,authenticated}
//     USING: true
// Table: financial_records
//   Policy "Admins full access financial_records" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Admins read all financials" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ( SELECT is_admin() AS is_admin)
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_master_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'admin'::text]))
//   Policy "admin_master_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'admin'::text]))
//   Policy "admin_master_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'admin'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'admin'::text]))
//   Policy "temp_anyone_read_all_financials" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "temp_anyone_read_financial_records" (SELECT, PERMISSIVE) roles={anon,authenticated}
//     USING: true
//   Policy "temp_emergency_read_all_financials" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: packages
//   Policy "Admins full access packages" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "temp_anyone_read_all" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
// Table: partnership_discounts
//   Policy "Admins full access partnership_discounts" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "master_or_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "temp_anyone_read_partnership_discounts" (SELECT, PERMISSIVE) roles={anon,authenticated}
//     USING: true
// Table: partnerships
//   Policy "Admins full access partnerships" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Everyone can view partnerships" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "master_or_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "temp_anyone_read_partnerships" (SELECT, PERMISSIVE) roles={anon,authenticated}
//     USING: true
// Table: professional_availability_overrides
//   Policy "Admins full access professional_availability_overrides" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "master_or_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
// Table: professional_notifications
//   Policy "Admins full access professional_notifications" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "master_or_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
// Table: professional_recurring_availability
//   Policy "Admins full access professional_recurring_availability" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "master_or_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
// Table: professional_services
//   Policy "Admins full access professional_services" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "master_or_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "temp_anyone_read_all" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
// Table: professionals
//   Policy "Admins can read all professionals" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Admins full access professionals" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Everyone can view professionals" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Professionals can read own record" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "Professionals update own record" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "Users can view own professional record" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "temp_anyone_read_all" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "temp_anyone_read_professionals" (SELECT, PERMISSIVE) roles={anon,authenticated}
//     USING: true
// Table: profiles
//   Policy "Admins can delete all profiles" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Admins can insert all profiles" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: is_admin()
//   Policy "Admins can read all profiles" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Admins can update all profiles" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Users can insert own profile" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (auth.uid() = id)
//   Policy "Users can read own profile" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = id)
//   Policy "profiles_read_admin" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_admin_simple()
//   Policy "profiles_read_own" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (( SELECT auth.uid() AS uid) = id)
//   Policy "profiles_update_admin" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_admin_simple()
//     WITH CHECK: is_admin_simple()
//   Policy "profiles_update_own" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (( SELECT auth.uid() AS uid) = id)
//     WITH CHECK: (( SELECT auth.uid() AS uid) = id)
// Table: schedules
//   Policy "Admins full access schedules" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "pro_master_can_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "pro_master_can_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "pro_master_can_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "pro_master_can_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "schedules_admin_bypass" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (( SELECT profiles.role
//               FROM profiles
//              WHERE (profiles.id = auth.uid())) = 'admin'::user_role)
//     WITH CHECK: (( SELECT profiles.role
//                    FROM profiles
//                   WHERE (profiles.id = auth.uid())) = 'admin'::user_role)
//   Policy "temp_anyone_read_all" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "temp_anyone_read_schedules" (SELECT, PERMISSIVE) roles={anon,authenticated}
//     USING: true
// Table: services
//   Policy "Admins full access services" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Everyone can view services" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "master_or_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "temp_anyone_read_all" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "temp_anyone_read_services" (SELECT, PERMISSIVE) roles={anon,authenticated}
//     USING: true
// Table: subscription_plans
//   Policy "Admins can delete subscription_plans" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Admins can insert subscription_plans" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: is_admin()
//   Policy "Admins can update subscription_plans" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_admin()
//   Policy "Authenticated users can view subscription_plans" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "admin_all_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "admin_all_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles pr
//              WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1
//                    FROM profiles pr
//                   WHERE ((pr.id = auth.uid()) AND (pr.role = 'admin'::user_role))))
//   Policy "master_or_pro_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_read" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "master_or_pro_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//     WITH CHECK: ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['master'::text, 'professional'::text]))
//   Policy "temp_anyone_read_all" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
// Table: time_tracking
//   Policy "Admins have full access to time_tracking" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1
//               FROM profiles
//              WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))
//   Policy "Professionals can insert their own time_tracking" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (professional_id IN ( SELECT professionals.id
//                    FROM professionals
//                   WHERE (professionals.user_id = auth.uid())))
//   Policy "Professionals can update their own time_tracking" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (professional_id IN ( SELECT professionals.id
//               FROM professionals
//              WHERE (professionals.user_id = auth.uid())))
//   Policy "Professionals can view their own time_tracking" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (professional_id IN ( SELECT professionals.id
//               FROM professionals
//              WHERE (professionals.user_id = auth.uid())))

// --- DATABASE FUNCTIONS ---
// FUNCTION book_appointment(uuid, uuid, uuid, uuid, boolean)
//   CREATE OR REPLACE FUNCTION public.book_appointment(p_schedule_id uuid, p_client_id uuid, p_service_id uuid, p_client_package_id uuid DEFAULT NULL::uuid, p_is_recurring boolean DEFAULT false)
//    RETURNS uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_professional_id UUID;
//     v_appointment_id UUID;
//     v_service_price NUMERIC;
//     v_service_duration INT;
//     v_service_value_type TEXT;
//     v_service_max_attendees INT;
//     v_client_partnership_id UUID;
//     v_discount_percentage NUMERIC;
//     v_final_price NUMERIC;
//     v_start_time TIMESTAMPTZ;
//     v_end_time TIMESTAMPTZ;
//     v_slots_to_book UUID[];
//     v_current_attendees INT;
//     v_subscription_count INT;
//     v_package_sessions INT;
//     v_schedule_id UUID;
//   BEGIN
//     -- 1. Get service details
//     SELECT duration_minutes, price, value_type, max_attendees 
//     INTO v_service_duration, v_service_price, v_service_value_type, v_service_max_attendees
//     FROM public.services
//     WHERE id = p_service_id;
//   
//     IF NOT FOUND THEN
//       RAISE EXCEPTION 'Serviço não encontrado.';
//     END IF;
//   
//     -- 2. Get the start time and professional ID from the initial schedule slot
//     SELECT start_time, professional_id INTO v_start_time, v_professional_id
//     FROM public.schedules
//     WHERE id = p_schedule_id;
//   
//     IF NOT FOUND THEN
//       RAISE EXCEPTION 'Horário de início inválido.';
//     END IF;
//   
//     -- 3. Calculate the appointment end time
//     v_end_time := v_start_time + (v_service_duration * interval '1 minute');
//   
//     -- 4. Identify all schedule slots required for this appointment
//     SELECT array_agg(id) INTO v_slots_to_book
//     FROM public.schedules
//     WHERE professional_id = v_professional_id
//       AND start_time >= v_start_time
//       AND start_time < v_end_time;
//   
//     IF v_slots_to_book IS NULL OR array_length(v_slots_to_book, 1) = 0 THEN
//         RAISE EXCEPTION 'Não foram encontrados horários suficientes na agenda do profissional.';
//     END IF;
//   
//     -- 5. VALIDATION: Check Client Availability (Avoid double booking for the client)
//     -- Checks if client has any active appointment that overlaps with the requested time
//     IF EXISTS (
//       SELECT 1
//       FROM public.appointments a
//       JOIN public.schedules s ON a.schedule_id = s.id
//       JOIN public.services srv ON a.service_id = srv.id
//       WHERE a.client_id = p_client_id
//         AND a.status NOT IN ('cancelled', 'no_show')
//         AND (
//           s.start_time < v_end_time 
//           AND 
//           (s.start_time + (srv.duration_minutes * interval '1 minute')) > v_start_time
//         )
//     ) THEN
//       RAISE EXCEPTION 'Cliente já está agendado neste horário.';
//     END IF;
//   
//     -- 6. VALIDATION: Check Professional Capacity for EACH slot required
//     -- We loop through required slots to check if any of them is full
//     FOREACH v_schedule_id IN ARRAY v_slots_to_book LOOP
//         SELECT count(*) INTO v_current_attendees
//         FROM public.appointments
//         WHERE schedule_id = v_schedule_id
//           AND status NOT IN ('cancelled', 'no_show');
//         
//         IF v_current_attendees >= v_service_max_attendees THEN
//            RAISE EXCEPTION 'Turma lotada para o horário de %.', v_start_time;
//         END IF;
//     END LOOP;
//   
//     -- 7. Determine Price and Validation based on Service Type
//     IF v_service_value_type = 'monthly' THEN
//       -- Check for active subscription
//       SELECT count(*) INTO v_subscription_count
//       FROM public.client_subscriptions
//       WHERE client_id = p_client_id
//         AND service_id = p_service_id
//         AND status = 'active'
//         AND (end_date IS NULL OR end_date > NOW());
//   
//       IF v_subscription_count = 0 THEN
//         RAISE EXCEPTION 'Cliente não possui assinatura ativa para este serviço mensal.';
//       END IF;
//   
//       v_final_price := 0; -- Subscription covers the cost
//   
//     ELSE -- 'session'
//       IF p_client_package_id IS NOT NULL THEN
//         -- Validate and use package
//         SELECT sessions_remaining INTO v_package_sessions
//         FROM public.client_packages
//         WHERE id = p_client_package_id
//           AND client_id = p_client_id
//           FOR UPDATE; -- Lock row
//   
//         IF NOT FOUND OR v_package_sessions <= 0 THEN
//           RAISE EXCEPTION 'Pacote inválido ou sem sessões disponíveis.';
//         END IF;
//   
//         -- Decrement session
//         UPDATE public.client_packages
//         SET sessions_remaining = sessions_remaining - 1
//         WHERE id = p_client_package_id;
//   
//         v_final_price := 0; -- Paid via package
//       ELSE
//         -- Standard single session payment calculation
//         SELECT partnership_id INTO v_client_partnership_id
//         FROM public.clients
//         WHERE id = p_client_id;
//   
//         v_final_price := v_service_price;
//   
//         IF v_client_partnership_id IS NOT NULL THEN
//           SELECT discount_percentage INTO v_discount_percentage
//           FROM public.partnership_discounts
//           WHERE partnership_id = v_client_partnership_id AND (service_id = p_service_id OR service_id IS NULL)
//           ORDER BY service_id IS NOT NULL DESC
//           LIMIT 1;
//   
//           IF FOUND AND v_discount_percentage IS NOT NULL THEN
//             v_final_price := v_service_price * (1 - (v_discount_percentage / 100.0));
//           END IF;
//         END IF;
//       END IF;
//     END IF;
//   
//     -- 8. Create the appointment
//     INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id, client_package_id, is_recurring)
//     VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id, p_client_package_id, p_is_recurring)
//     RETURNING id INTO v_appointment_id;
//   
//     -- 9. Update is_booked flag on schedules IF they reached capacity
//     FOREACH v_schedule_id IN ARRAY v_slots_to_book LOOP
//         SELECT count(*) INTO v_current_attendees
//         FROM public.appointments
//         WHERE schedule_id = v_schedule_id
//           AND status NOT IN ('cancelled', 'no_show');
//         
//         IF v_current_attendees >= v_service_max_attendees THEN
//            UPDATE public.schedules SET is_booked = TRUE WHERE id = v_schedule_id;
//         END IF;
//     END LOOP;
//   
//     -- 10. Create a financial record
//     INSERT INTO public.financial_records (client_id, professional_id, appointment_id, client_package_id, amount, description, payment_method)
//     VALUES (
//       p_client_id, 
//       v_professional_id, 
//       v_appointment_id, 
//       p_client_package_id, 
//       v_final_price, 
//       CASE 
//         WHEN v_service_value_type = 'monthly' THEN 'Agendamento via Assinatura Mensal'
//         WHEN p_client_package_id IS NOT NULL THEN 'Agendamento via Pacote'
//         ELSE 'Pagamento por agendamento avulso'
//       END,
//       CASE 
//         WHEN v_service_value_type = 'monthly' OR p_client_package_id IS NOT NULL THEN 'Crédito/Assinatura'
//         ELSE 'Pendente'
//       END
//     );
//   
//     RETURN v_appointment_id;
//   END;
//   $function$
//   
// FUNCTION book_appointment_dynamic(uuid, uuid, uuid, timestamp with time zone, uuid, boolean)
//   CREATE OR REPLACE FUNCTION public.book_appointment_dynamic(p_professional_id uuid, p_client_id uuid, p_service_id uuid, p_start_time timestamp with time zone, p_client_package_id uuid DEFAULT NULL::uuid, p_is_recurring boolean DEFAULT false)
//    RETURNS uuid
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//     v_schedule_id UUID;
//     v_duration INT;
//     v_end_time TIMESTAMPTZ;
//     v_appointment_id UUID;
//   BEGIN
//     -- Get Duration
//     SELECT duration_minutes INTO v_duration FROM services WHERE id = p_service_id;
//     v_end_time := p_start_time + (v_duration || ' minutes')::interval;
//   
//     -- 1. Ensure Schedule Exists
//     -- We try to find an existing schedule at the exact start time
//     SELECT id INTO v_schedule_id 
//     FROM schedules 
//     WHERE professional_id = p_professional_id AND start_time = p_start_time;
//   
//     IF v_schedule_id IS NULL THEN
//       -- If no exact schedule, check if we can create one (no overlap with blocking events)
//       -- We allow overlap with *appointments* if they are part of a multi-attendee slot (handled by book_appointment),
//       -- BUT here we are creating a new schedule row. Usually, one schedule row per slot.
//       -- If a schedule doesn't exist at this time, check if another staggered schedule blocks it.
//       
//       IF EXISTS (
//           SELECT 1 FROM schedules s
//           WHERE s.professional_id = p_professional_id
//           AND s.start_time < v_end_time AND s.end_time > p_start_time
//           AND EXISTS (SELECT 1 FROM appointments a WHERE a.schedule_id = s.id AND a.status != 'cancelled')
//       ) THEN
//            RAISE EXCEPTION 'Conflito de horário com outro agendamento existente.';
//       END IF;
//   
//       INSERT INTO schedules (professional_id, start_time, end_time)
//       VALUES (p_professional_id, p_start_time, v_end_time)
//       RETURNING id INTO v_schedule_id;
//     END IF;
//   
//     -- 2. Call book_appointment (which performs capacity checks)
//     v_appointment_id := book_appointment(
//       p_schedule_id := v_schedule_id,
//       p_client_id := p_client_id,
//       p_service_id := p_service_id,
//       p_client_package_id := p_client_package_id,
//       p_is_recurring := p_is_recurring
//     );
//   
//     RETURN v_appointment_id;
//   END;
//   $function$
//   
// FUNCTION book_recurring_appointment_series(uuid, uuid, uuid, timestamp with time zone, uuid, integer)
//   CREATE OR REPLACE FUNCTION public.book_recurring_appointment_series(p_professional_id uuid, p_client_id uuid, p_service_id uuid, p_start_time timestamp with time zone, p_client_package_id uuid DEFAULT NULL::uuid, p_occurrences integer DEFAULT 1)
//    RETURNS void
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//     v_i INT;
//     v_current_start_time TIMESTAMPTZ;
//   BEGIN
//     IF p_occurrences < 1 THEN
//       RAISE EXCEPTION 'O número de ocorrências deve ser pelo menos 1.';
//     END IF;
//   
//     IF p_occurrences > 52 THEN
//       RAISE EXCEPTION 'O número máximo de ocorrências é 52 (1 ano).';
//     END IF;
//   
//     FOR v_i IN 0..(p_occurrences - 1) LOOP
//       v_current_start_time := p_start_time + (v_i * interval '1 week');
//   
//       BEGIN
//         -- Call the updated dynamic booking function
//         PERFORM book_appointment_dynamic(
//           p_professional_id := p_professional_id,
//           p_client_id := p_client_id,
//           p_service_id := p_service_id,
//           p_start_time := v_current_start_time,
//           p_client_package_id := p_client_package_id,
//           p_is_recurring := TRUE
//         );
//       EXCEPTION WHEN OTHERS THEN
//          RAISE EXCEPTION 'Erro ao agendar para %: %', v_current_start_time::date, SQLERRM;
//       END;
//       
//     END LOOP;
//   END;
//   $function$
//   
// FUNCTION cancel_appointment(uuid)
//   CREATE OR REPLACE FUNCTION public.cancel_appointment(p_appointment_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_schedule_id UUID;
//   BEGIN
//     -- Get the schedule_id from the appointment
//     SELECT schedule_id INTO v_schedule_id
//     FROM public.appointments
//     WHERE id = p_appointment_id;
//   
//     IF NOT FOUND THEN
//       RAISE EXCEPTION 'Agendamento não encontrado.';
//     END IF;
//   
//     -- Update appointment status to cancelled
//     UPDATE public.appointments
//     SET status = 'cancelled'
//     WHERE id = p_appointment_id;
//   
//     -- REMOVED: Free up the schedule slot (is_booked) logic
//   END;
//   $function$
//   
// FUNCTION check_daily_birthdays()
//   CREATE OR REPLACE FUNCTION public.check_daily_birthdays()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_client_record RECORD;
//     v_admin_id UUID;
//     v_today_md TEXT;
//   BEGIN
//     v_today_md := to_char(NOW(), 'MM-DD');
//   
//     FOR v_client_record IN
//       SELECT id, name, birth_date
//       FROM public.clients
//       WHERE is_active = true 
//         AND birth_date IS NOT NULL 
//         AND to_char(birth_date, 'MM-DD') = v_today_md
//     LOOP
//       
//       -- Notify all admins
//       FOR v_admin_id IN 
//         SELECT p.id 
//         FROM public.professionals p
//         JOIN public.profiles pr ON pr.id = p.user_id
//         WHERE pr.role = 'admin'
//       LOOP
//         -- Check if notification already exists for today to avoid duplicates if run multiple times
//         IF NOT EXISTS (
//           SELECT 1 FROM public.professional_notifications
//           WHERE professional_id = v_admin_id
//             AND related_entity_id = v_client_record.id
//             AND type = 'new_appointment' -- Reusing a type or using a generic message, ideally 'birthday' if enum existed, but we can use message content
//             AND message LIKE '%aniversário hoje%'
//             AND created_at > CURRENT_DATE
//         ) THEN
//           INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
//           VALUES (
//             v_admin_id,
//             'new_appointment', -- Using 'new_appointment' as generic type since 'birthday' isn't in enum yet, or we add it. 
//             -- Actually let's just use message text since frontend displays text. Or use 'schedule_changed' as generic info.
//             -- Ideally we should alter enum, but for safety in this migration let's stick to existing or just cast.
//             -- Wait, we added 'package_renewal' in previous file. Let's assume we can add 'birthday' here.
//             -- Or better, reuse 'new_appointment' as "Alert"
//             '🎉 Hoje é o aniversário de ' || v_client_record.name || '! Parabenize-o(a).',
//             v_client_record.id,
//             '/admin/pacientes/' || v_client_record.id
//           );
//         END IF;
//       END LOOP;
//   
//     END LOOP;
//   END;
//   $function$
//   
// FUNCTION complete_appointment(uuid)
//   CREATE OR REPLACE FUNCTION public.complete_appointment(p_appointment_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_appointment RECORD;
//     v_service_price NUMERIC;
//     v_service_value_type TEXT;
//     v_client_partnership_id UUID;
//     v_discount_percentage NUMERIC;
//     v_final_price NUMERIC;
//     v_financial_record_id UUID;
//   BEGIN
//     -- Step 1: Fetch appointment and service details
//     SELECT a.*, s.price as service_price, s.value_type
//     INTO v_appointment
//     FROM public.appointments a
//     JOIN public.services s ON a.service_id = s.id
//     WHERE a.id = p_appointment_id;
//   
//     v_service_price := v_appointment.service_price;
//     v_service_value_type := v_appointment.value_type;
//   
//     IF NOT FOUND THEN
//       RAISE EXCEPTION 'Agendamento com ID % não encontrado.', p_appointment_id;
//     END IF;
//   
//     -- Step 2: Update appointment status to 'completed'
//     UPDATE public.appointments
//     SET status = 'completed'
//     WHERE id = p_appointment_id;
//   
//     -- Step 3: Check if a financial record for this appointment already exists
//     SELECT id INTO v_financial_record_id
//     FROM public.financial_records
//     WHERE appointment_id = p_appointment_id;
//   
//     -- Step 4: Logic to determine final price
//     v_final_price := v_service_price;
//   
//     -- CHECK FOR PACKAGE OR SUBSCRIPTION
//     IF v_appointment.client_package_id IS NOT NULL THEN
//       v_final_price := 0;
//     ELSIF v_service_value_type = 'monthly' THEN
//       v_final_price := 0;
//     ELSE
//       -- Standard calculation for single sessions
//       -- Check if the client has a partnership to apply discounts
//       SELECT partnership_id INTO v_client_partnership_id
//       FROM public.clients
//       WHERE id = v_appointment.client_id;
//   
//       IF v_client_partnership_id IS NOT NULL THEN
//         -- Find the best matching discount (specific service > generic)
//         SELECT discount_percentage INTO v_discount_percentage
//         FROM public.partnership_discounts
//         WHERE partnership_id = v_client_partnership_id
//           AND (service_id = v_appointment.service_id OR service_id IS NULL)
//         ORDER BY service_id IS NOT NULL DESC
//         LIMIT 1;
//   
//         -- Apply discount if found
//         IF FOUND AND v_discount_percentage IS NOT NULL THEN
//           v_final_price := v_service_price * (1 - (v_discount_percentage / 100.0));
//         END IF;
//       END IF;
//   
//       -- Apply manual discount if present (ensure non-negative)
//       IF v_appointment.discount_amount IS NOT NULL THEN
//           v_final_price := GREATEST(0, v_final_price - v_appointment.discount_amount);
//       END IF;
//     END IF;
//   
//     -- Step 5: If a financial record does not exist, create one
//     IF v_financial_record_id IS NULL THEN
//       INSERT INTO public.financial_records (
//         client_id, 
//         professional_id, 
//         appointment_id, 
//         client_package_id,
//         amount, 
//         description, 
//         payment_method, 
//         payment_date
//       )
//       VALUES (
//         v_appointment.client_id, 
//         v_appointment.professional_id, 
//         p_appointment_id, 
//         v_appointment.client_package_id,
//         v_final_price, 
//         CASE
//           WHEN v_appointment.client_package_id IS NOT NULL THEN 'Serviço realizado (Pacote)'
//           WHEN v_service_value_type = 'monthly' THEN 'Serviço realizado (Assinatura)'
//           ELSE 'Pagamento por serviço realizado'
//         END,
//         CASE
//           WHEN v_appointment.client_package_id IS NOT NULL THEN 'Crédito/Pacote'
//           WHEN v_service_value_type = 'monthly' THEN 'Assinatura'
//           ELSE 'Pendente'
//         END,
//         NOW()
//       );
//     ELSE
//       -- If the record exists, update the amount to ensure correctness (fixing historical errors)
//       -- and update payment date if null
//       UPDATE public.financial_records
//       SET 
//         amount = v_final_price,
//         payment_date = COALESCE(payment_date, NOW())
//       WHERE id = v_financial_record_id;
//     END IF;
//   
//   END;
//   $function$
//   
// FUNCTION get_annual_comparative(uuid, uuid, uuid)
//   CREATE OR REPLACE FUNCTION public.get_annual_comparative(p_professional_id uuid DEFAULT NULL::uuid, p_service_id uuid DEFAULT NULL::uuid, p_partnership_id uuid DEFAULT NULL::uuid)
//    RETURNS TABLE(month text, total_revenue numeric, total_appointments bigint)
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       RETURN QUERY
//       WITH months AS (
//           SELECT to_char(date_trunc('month', generate_series(
//               date_trunc('month', NOW() - interval '11 months'),
//               date_trunc('month', NOW()),
//               '1 month'
//           )), 'YYYY-MM') AS month
//       ),
//       monthly_revenue AS (
//           SELECT
//               to_char(date_trunc('month', fr.payment_date), 'YYYY-MM') AS revenue_month,
//               SUM(fr.amount) AS amount
//           FROM public.financial_records fr
//           LEFT JOIN public.appointments a ON fr.appointment_id = a.id
//           LEFT JOIN public.client_packages cp ON fr.client_package_id = cp.id
//           LEFT JOIN public.packages pkg ON cp.package_id = pkg.id
//           LEFT JOIN public.client_subscriptions cs ON fr.client_subscription_id = cs.id
//           LEFT JOIN public.clients c ON fr.client_id = c.id
//           WHERE fr.payment_date >= (NOW() - interval '1 year')
//           AND (p_professional_id IS NULL OR fr.professional_id = p_professional_id)
//           AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
//           AND (p_service_id IS NULL OR
//                a.service_id = p_service_id OR
//                pkg.service_id = p_service_id OR
//                cs.service_id = p_service_id
//           )
//           GROUP BY 1
//       ),
//       monthly_appointments AS (
//           SELECT
//               to_char(date_trunc('month', sch.start_time), 'YYYY-MM') AS appt_month,
//               COUNT(DISTINCT a.id) AS count
//           FROM public.appointments a
//           JOIN public.schedules sch ON a.schedule_id = sch.id
//           LEFT JOIN public.clients c ON a.client_id = c.id
//           WHERE a.status = 'completed'
//           AND sch.start_time >= (NOW() - interval '1 year')
//           AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
//           AND (p_service_id IS NULL OR a.service_id = p_service_id)
//           AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
//           GROUP BY 1
//       )
//       SELECT
//           m.month,
//           COALESCE(mr.amount, 0) AS total_revenue,
//           COALESCE(ma.count, 0) AS total_appointments
//       FROM months m
//       LEFT JOIN monthly_revenue mr ON m.month = mr.revenue_month
//       LEFT JOIN monthly_appointments ma ON m.month = ma.appt_month
//       ORDER BY m.month;
//   END;
//   $function$
//   
// FUNCTION get_available_dates(uuid, uuid, text, text)
//   CREATE OR REPLACE FUNCTION public.get_available_dates(p_professional_id uuid, p_service_id uuid, p_start_date text, p_end_date text)
//    RETURNS TABLE(available_date text)
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     SELECT DISTINCT (s.start_time::date)::text
//     FROM schedules s
//     WHERE s.professional_id = p_professional_id
//       AND s.start_time >= p_start_date::timestamptz
//       AND s.start_time <= p_end_date::timestamptz
//       AND NOT EXISTS (
//         SELECT 1 FROM professional_availability_overrides o
//         WHERE o.professional_id = p_professional_id
//         AND o.override_date = s.start_time::date
//         AND o.start_time <= s.start_time::time
//         AND o.end_time > s.start_time::time
//         AND o.is_available = false
//       )
//     ORDER BY 1;
//   END;
//   $function$
//   
// FUNCTION get_available_dates(uuid, uuid, date, date)
//   CREATE OR REPLACE FUNCTION public.get_available_dates(p_professional_id uuid, p_service_id uuid, p_start_date date, p_end_date date)
//    RETURNS TABLE(available_date date)
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//       v_service_duration INT;
//       v_slot_interval_minutes INT := 30;
//       v_slots_needed INT;
//   BEGIN
//       -- Diagnostic Log
//       RAISE NOTICE 'get_available_dates called for Professional: %, Service: %, Range: % to %', p_professional_id, p_service_id, p_start_date, p_end_date;
//   
//       SELECT duration_minutes INTO v_service_duration FROM public.services WHERE id = p_service_id;
//   
//       IF NOT FOUND THEN
//           RAISE NOTICE 'Service % not found', p_service_id;
//           RETURN;
//       END IF;
//   
//       -- Calculate slots needed
//       v_slots_needed := CEIL(v_service_duration::float / v_slot_interval_minutes);
//       RAISE NOTICE 'Service Duration: % min, Slots Needed: %', v_service_duration, v_slots_needed;
//   
//       RETURN QUERY
//       WITH 
//       -- 1. Identify Busy Intervals (Appointments)
//       busy_intervals AS (
//           SELECT
//               s.start_time AS start_time,
//               s.start_time + (ser.duration_minutes || ' minutes')::interval AS end_time
//           FROM appointments a
//           JOIN schedules s ON a.schedule_id = s.id
//           JOIN services ser ON a.service_id = ser.id
//           WHERE a.professional_id = p_professional_id
//           AND a.status != 'cancelled'
//           AND s.start_time >= p_start_date::timestamp
//           AND s.start_time < (p_end_date + 1)::timestamp
//       ),
//       -- 2. Fetch Potential Slots from Schedules Table
//       -- The schedules table is populated by the edge function based on recurring rules and overrides
//       potential_slots AS (
//           SELECT
//               s.id,
//               s.start_time,
//               (s.start_time::date) as schedule_date
//           FROM public.schedules s
//           WHERE s.professional_id = p_professional_id
//             AND s.start_time >= p_start_date::timestamp
//             AND s.start_time < (p_end_date + 1)::timestamp
//       ),
//       -- 3. Filter Slots (Dynamic Overrides & Conflicts)
//       valid_slots AS (
//           SELECT
//               ps.id,
//               ps.start_time,
//               ps.schedule_date
//           FROM potential_slots ps
//           WHERE 
//             -- Check 1: Not blocked by a negative override (Granular blocking)
//             NOT EXISTS (
//                 SELECT 1 FROM professional_availability_overrides o
//                 WHERE o.professional_id = p_professional_id
//                 AND o.override_date = ps.schedule_date
//                 AND o.start_time <= ps.start_time::time
//                 AND o.end_time > ps.start_time::time
//                 AND o.is_available = false
//             )
//             -- Check 2: Not overlapping with any existing appointment
//             AND NOT EXISTS (
//                SELECT 1 FROM busy_intervals b
//                WHERE (ps.start_time, ps.start_time + (v_service_duration || ' minutes')::interval) OVERLAPS (b.start_time, b.end_time)
//             )
//       ),
//       -- 4. Check for Consecutive Availability
//       consecutive_groups AS (
//           SELECT
//               vs.schedule_date,
//               vs.start_time,
//               -- Look ahead to see if we have enough slots
//               LEAD(vs.start_time, v_slots_needed - 1) OVER (PARTITION BY vs.schedule_date ORDER BY vs.start_time) as end_slot_start
//           FROM valid_slots vs
//       )
//       SELECT DISTINCT cg.schedule_date
//       FROM consecutive_groups cg
//       WHERE cg.end_slot_start IS NOT NULL
//       -- Verify the sequence is contiguous (difference between Nth slot start and current start equals (N-1) intervals)
//       AND (cg.end_slot_start - cg.start_time) = ((v_slots_needed - 1) * v_slot_interval_minutes || ' minutes')::interval
//       ORDER BY cg.schedule_date;
//   END;
//   $function$
//   
// FUNCTION get_available_dates_dynamic(uuid, uuid, timestamp with time zone, timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.get_available_dates_dynamic(p_professional_id uuid, p_service_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
//    RETURNS TABLE(available_date date)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       v_timezone TEXT := 'America/Sao_Paulo';
//   BEGIN
//       -- Calls the slot generation function (which already handles availability logic)
//       -- and extracts distinct dates from the available slots
//       RETURN QUERY
//       SELECT DISTINCT (start_time AT TIME ZONE v_timezone)::date
//       FROM public.get_available_slots_dynamic(
//           p_professional_id, 
//           p_service_id, 
//           p_start_date, 
//           p_end_date
//       )
//       ORDER BY 1;
//   END;
//   $function$
//   
// FUNCTION get_available_professionals_at_time_dynamic(uuid, timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.get_available_professionals_at_time_dynamic(p_service_id uuid, p_start_time timestamp with time zone)
//    RETURNS TABLE(id uuid, name text, avatar_url text, specialty text, current_occupancy bigint, max_capacity bigint)
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//       v_service_duration INTEGER;
//       v_max_attendees INTEGER;
//       v_end_time TIMESTAMP WITH TIME ZONE;
//       v_timezone TEXT := 'America/Sao_Paulo';
//       v_start_time_sp TIMESTAMP;
//       v_end_time_sp TIMESTAMP;
//       v_day_of_week INTEGER;
//   BEGIN
//       -- Explicitly alias 'services' table to 's' to avoid collision with output parameter 'id' if exists
//       SELECT s.duration_minutes, s.max_attendees 
//       INTO v_service_duration, v_max_attendees
//       FROM services s 
//       WHERE s.id = p_service_id;
//   
//       v_end_time := p_start_time + (v_service_duration || ' minutes')::INTERVAL;
//       
//       v_start_time_sp := p_start_time AT TIME ZONE v_timezone;
//       v_end_time_sp := v_end_time AT TIME ZONE v_timezone;
//       v_day_of_week := EXTRACT(DOW FROM v_start_time_sp);
//   
//       RETURN QUERY
//       SELECT 
//           p.id,
//           p.name,
//           p.avatar_url,
//           p.specialty,
//           COALESCE(sub.current_count, 0) as current_occupancy,
//           COALESCE(v_max_attendees, 1)::BIGINT as max_capacity
//       FROM professionals p
//       JOIN professional_services ps ON p.id = ps.professional_id
//       LEFT JOIN LATERAL (
//           SELECT 
//               s.id as schedule_id,
//               COUNT(a.id) as current_count,
//               MAX(a.service_id::text)::uuid as booked_service_id
//           FROM schedules s
//           LEFT JOIN appointments a ON s.id = a.schedule_id AND a.status != 'cancelled'
//           WHERE s.professional_id = p.id
//           AND s.start_time = p_start_time
//           GROUP BY s.id
//       ) sub ON TRUE
//       WHERE 
//           ps.service_id = p_service_id
//           AND p.is_active = TRUE
//           
//           -- AVAILABILITY CHECK
//           AND (
//               -- 1. Positive Override
//               EXISTS (
//                   SELECT 1 FROM professional_availability_overrides o
//                   WHERE o.professional_id = p.id
//                   AND o.override_date = v_start_time_sp::DATE
//                   AND o.is_available = TRUE
//                   AND o.start_time <= v_start_time_sp::TIME
//                   AND o.end_time >= v_end_time_sp::TIME
//                   AND (o.service_ids IS NULL OR p_service_id = ANY(o.service_ids))
//               )
//               OR (
//                   -- 2. Recurring Availability (if no blocking override)
//                   EXISTS (
//                       SELECT 1 FROM professional_recurring_availability r
//                       WHERE r.professional_id = p.id
//                       AND r.day_of_week = v_day_of_week
//                       AND r.start_time <= v_start_time_sp::TIME
//                       AND r.end_time >= v_end_time_sp::TIME
//                       AND (r.service_ids IS NULL OR p_service_id = ANY(r.service_ids))
//                   )
//                   AND NOT EXISTS (
//                       SELECT 1 FROM professional_availability_overrides o
//                       WHERE o.professional_id = p.id
//                       AND o.override_date = v_start_time_sp::DATE
//                       AND o.is_available = FALSE
//                       AND o.start_time < v_end_time_sp::TIME
//                       AND o.end_time > v_start_time_sp::TIME
//                   )
//               )
//           )
//   
//           -- CAPACITY CHECK
//           AND (
//               sub.schedule_id IS NULL -- OK
//               OR (
//                   (sub.booked_service_id IS NULL OR sub.booked_service_id = p_service_id)
//                   AND sub.current_count < v_max_attendees
//               )
//           )
//   
//           -- OVERLAP CHECK
//           AND NOT EXISTS (
//               SELECT 1 FROM schedules s_overlap
//               WHERE s_overlap.professional_id = p.id
//               AND s_overlap.start_time < v_end_time
//               AND s_overlap.end_time > p_start_time
//               AND s_overlap.start_time != p_start_time
//               AND EXISTS (
//                   SELECT 1 FROM appointments a 
//                   WHERE a.schedule_id = s_overlap.id 
//                   AND a.status != 'cancelled'
//               )
//           );
//   END;
//   $function$
//   
// FUNCTION get_available_professionals_for_service_at_time(uuid, timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.get_available_professionals_for_service_at_time(p_service_id uuid, p_start_time timestamp with time zone)
//    RETURNS TABLE(id uuid, name text, specialty text, avatar_url text)
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     SELECT DISTINCT
//       p.id,
//       p.name,
//       p.specialty,
//       p.avatar_url
//     FROM professionals p
//     JOIN professional_services ps ON ps.professional_id = p.id
//     JOIN schedules s ON s.professional_id = p.id
//     WHERE ps.service_id = p_service_id
//       AND s.start_time = p_start_time
//       AND s.id NOT IN (
//         SELECT schedule_id 
//         FROM appointments 
//         WHERE status NOT IN ('cancelled', 'no_show')
//       )
//     ORDER BY p.name;
//   END;
//   $function$
//   
// FUNCTION get_available_slots_dynamic(uuid, uuid, timestamp with time zone, timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.get_available_slots_dynamic(p_professional_id uuid, p_service_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
//    RETURNS TABLE(start_time timestamp with time zone, end_time timestamp with time zone, schedule_id uuid, current_count bigint, max_capacity bigint)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       v_service_duration INTEGER;
//       v_max_attendees INTEGER;
//       v_slot_start TIMESTAMP WITH TIME ZONE;
//       v_slot_end TIMESTAMP WITH TIME ZONE;
//       v_slot_local_start TIMESTAMP WITHOUT TIME ZONE;
//       v_slot_local_end TIMESTAMP WITHOUT TIME ZONE;
//       v_day_of_week INTEGER;
//       v_is_available BOOLEAN;
//       v_has_blocking_override BOOLEAN;
//       v_has_positive_override BOOLEAN;
//       v_has_recurring BOOLEAN;
//       v_existing_schedule_id UUID;
//       v_existing_service_id UUID;
//       v_current_attendees BIGINT;
//       v_timezone TEXT := 'America/Sao_Paulo';
//   BEGIN
//       -- 1. Get Service Info
//       SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
//       FROM services WHERE id = p_service_id;
//       
//       -- Default capacity to 1 if not set
//       v_max_attendees := COALESCE(v_max_attendees, 1);
//   
//       -- 2. Iterate through slots
//       FOR v_slot_start IN SELECT generate_series(p_start_date, p_end_date - (v_service_duration || ' minutes')::INTERVAL, '30 minutes'::INTERVAL) LOOP
//           v_slot_end := v_slot_start + (v_service_duration || ' minutes')::INTERVAL;
//           
//           -- Convert to Local Time for Availability Rules (Overrides are stored in local Date/Time)
//           v_slot_local_start := v_slot_start AT TIME ZONE v_timezone;
//           v_slot_local_end := v_slot_end AT TIME ZONE v_timezone;
//           v_day_of_week := EXTRACT(DOW FROM v_slot_local_start);
//           
//           -- 3. Check Availability Rules
//           v_is_available := FALSE;
//           
//           -- 3.1 Blocking Override
//           SELECT EXISTS (
//               SELECT 1 FROM professional_availability_overrides pao
//               WHERE pao.professional_id = p_professional_id 
//               AND pao.override_date = v_slot_local_start::DATE
//               AND pao.is_available = FALSE
//               AND pao.start_time < v_slot_local_end::TIME
//               AND pao.end_time > v_slot_local_start::TIME
//           ) INTO v_has_blocking_override;
//   
//           -- 3.2 Positive Override
//           SELECT EXISTS (
//               SELECT 1 FROM professional_availability_overrides pao
//               WHERE pao.professional_id = p_professional_id 
//               AND pao.override_date = v_slot_local_start::DATE
//               AND pao.is_available = TRUE
//               AND pao.start_time <= v_slot_local_start::TIME
//               AND pao.end_time >= v_slot_local_end::TIME
//               AND (pao.service_ids IS NULL OR p_service_id = ANY(pao.service_ids))
//           ) INTO v_has_positive_override;
//   
//           -- 3.3 Recurring Availability
//           SELECT EXISTS (
//               SELECT 1 FROM professional_recurring_availability pra
//               WHERE pra.professional_id = p_professional_id 
//               AND pra.day_of_week = v_day_of_week
//               AND pra.start_time <= v_slot_local_start::TIME
//               AND pra.end_time >= v_slot_local_end::TIME
//               AND (pra.service_ids IS NULL OR p_service_id = ANY(pra.service_ids))
//           ) INTO v_has_recurring;
//   
//           IF v_has_positive_override THEN
//               v_is_available := TRUE;
//           ELSIF v_has_recurring AND NOT v_has_blocking_override THEN
//               v_is_available := TRUE;
//           END IF;
//   
//           -- 4. Check Capacity & Conflicts
//           IF v_is_available THEN
//               v_current_attendees := 0;
//               v_existing_schedule_id := NULL;
//               v_existing_service_id := NULL;
//               
//               -- Check for existing schedule at this EXACT time
//               SELECT 
//                   s.id,
//                   COUNT(a.id) FILTER (WHERE a.status NOT IN ('cancelled', 'no_show')),
//                   MAX(a.service_id::text)::uuid
//               INTO
//                   v_existing_schedule_id,
//                   v_current_attendees,
//                   v_existing_service_id
//               FROM schedules s
//               LEFT JOIN appointments a ON s.id = a.schedule_id
//               WHERE s.professional_id = p_professional_id
//               AND s.start_time = v_slot_start
//               GROUP BY s.id;
//   
//               IF v_existing_schedule_id IS NOT NULL THEN
//                   -- Schedule Exists: Check Capacity and Service Match
//                   -- The slot is available ONLY IF current count < max capacity AND service matches
//                   IF v_current_attendees < v_max_attendees THEN
//                        IF (v_existing_service_id IS NULL OR v_existing_service_id = p_service_id) THEN
//                           start_time := v_slot_start;
//                           end_time := v_slot_end;
//                           schedule_id := v_existing_schedule_id;
//                           current_count := v_current_attendees;
//                           max_capacity := v_max_attendees;
//                           RETURN NEXT;
//                        END IF;
//                   END IF;
//               ELSE
//                   -- No Exact Schedule: Check for Staggered Overlaps
//                   -- We cannot create a slot if it overlaps with another existing schedule
//                   IF NOT EXISTS (
//                       SELECT 1 FROM schedules s
//                       WHERE s.professional_id = p_professional_id
//                       AND s.start_time < v_slot_end AND s.end_time > v_slot_start
//                       AND EXISTS (SELECT 1 FROM appointments a WHERE a.schedule_id = s.id AND a.status NOT IN ('cancelled', 'no_show'))
//                   ) THEN
//                       start_time := v_slot_start;
//                       end_time := v_slot_end;
//                       schedule_id := NULL;
//                       current_count := 0;
//                       max_capacity := v_max_attendees;
//                       RETURN NEXT;
//                   END IF;
//               END IF;
//           END IF;
//       END LOOP;
//   END;
//   $function$
//   
// FUNCTION get_available_slots_for_service(uuid, uuid, text, text)
//   CREATE OR REPLACE FUNCTION public.get_available_slots_for_service(p_professional_id uuid, p_service_id uuid, p_start_date text, p_end_date text)
//    RETURNS TABLE(id uuid, professional_id uuid, start_time timestamp with time zone, end_time timestamp with time zone, current_count bigint, max_capacity integer)
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//     v_start_ts TIMESTAMPTZ;
//     v_end_ts TIMESTAMPTZ;
//     v_service_duration INT;
//     v_slot_interval_minutes INT := 30;
//     v_slots_needed INT;
//     v_lead_offset INT;
//   BEGIN
//     -- Basic validation
//     IF p_professional_id IS NULL OR p_service_id IS NULL OR p_start_date IS NULL OR p_end_date IS NULL THEN
//       RETURN;
//     END IF;
//   
//     v_start_ts := p_start_date::TIMESTAMPTZ;
//     v_end_ts := p_end_date::TIMESTAMPTZ;
//   
//     -- Get service duration
//     SELECT duration_minutes INTO v_service_duration
//     FROM services
//     WHERE id = p_service_id;
//     
//     IF v_service_duration IS NULL THEN
//       RETURN;
//     END IF;
//   
//     -- Calculate needed slots
//     v_slots_needed := CEIL(v_service_duration::numeric / v_slot_interval_minutes::numeric);
//     IF v_slots_needed < 1 THEN v_slots_needed := 1; END IF;
//     v_lead_offset := v_slots_needed - 1;
//   
//     RETURN QUERY
//     WITH valid_slots AS (
//       SELECT
//         s.id,
//         s.professional_id,
//         s.start_time,
//         s.end_time
//       FROM schedules s
//       WHERE s.professional_id = p_professional_id
//         AND s.start_time >= v_start_ts
//         AND s.start_time <= v_end_ts
//         -- Only check for manual blocks (overrides)
//         AND NOT EXISTS (
//             SELECT 1 FROM professional_availability_overrides o
//             WHERE o.professional_id = p_professional_id
//             AND o.override_date = s.start_time::date
//             AND o.start_time <= s.start_time::time
//             AND o.end_time > s.start_time::time
//             AND o.is_available = false
//         )
//     ),
//     consecutive_slots AS (
//         SELECT
//             vs.id,
//             vs.professional_id,
//             vs.start_time,
//             vs.end_time,
//             LEAD(vs.start_time, v_lead_offset) OVER (ORDER BY vs.start_time) as nth_slot_start_time
//         FROM valid_slots vs
//     )
//     SELECT
//       cs.id,
//       cs.professional_id,
//       cs.start_time,
//       cs.end_time,
//       0::BIGINT as current_count, -- Dummy value, capacity ignored
//       999 as max_capacity -- Dummy value, capacity ignored
//     FROM consecutive_slots cs
//     WHERE cs.nth_slot_start_time IS NOT NULL
//     AND cs.nth_slot_start_time = (cs.start_time + (v_lead_offset * v_slot_interval_minutes || ' minutes')::interval);
//   END;
//   $function$
//   
// FUNCTION get_clients_with_birthday_this_week(date, date)
//   CREATE OR REPLACE FUNCTION public.get_clients_with_birthday_this_week(p_start_date date, p_end_date date)
//    RETURNS TABLE(id uuid, name text, birth_date date, email text, phone text)
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       IF to_char(p_start_date, 'MM-DD') > to_char(p_end_date, 'MM-DD') THEN
//           -- Period wraps around the year (e.g. Dec to Jan)
//           RETURN QUERY
//           SELECT c.id, c.name, c.birth_date, c.email, c.phone
//           FROM clients c
//           WHERE c.birth_date IS NOT NULL
//           AND (
//               to_char(c.birth_date, 'MM-DD') >= to_char(p_start_date, 'MM-DD')
//               OR
//               to_char(c.birth_date, 'MM-DD') <= to_char(p_end_date, 'MM-DD')
//           )
//           ORDER BY to_char(c.birth_date, 'MM-DD');
//       ELSE
//           -- Standard period within the same year
//           RETURN QUERY
//           SELECT c.id, c.name, c.birth_date, c.email, c.phone
//           FROM clients c
//           WHERE c.birth_date IS NOT NULL
//           AND to_char(c.birth_date, 'MM-DD') BETWEEN to_char(p_start_date, 'MM-DD') AND to_char(p_end_date, 'MM-DD')
//           ORDER BY to_char(c.birth_date, 'MM-DD');
//       END IF;
//   END;
//   $function$
//   
// FUNCTION get_clients_with_birthday_this_week_safe()
//   CREATE OR REPLACE FUNCTION public.get_clients_with_birthday_this_week_safe()
//    RETURNS SETOF clients
//    LANGUAGE sql
//    STABLE
//   AS $function$
//     SELECT c.*
//     FROM public.clients c
//     WHERE c.birth_date IS NOT NULL
//       AND to_char(c.birth_date, 'MM-DD') BETWEEN to_char(current_date, 'MM-DD')
//                                              AND to_char(current_date + interval '7 day', 'MM-DD');
//   $function$
//   
// FUNCTION get_kpi_metrics(date, date, uuid, uuid, uuid)
//   CREATE OR REPLACE FUNCTION public.get_kpi_metrics(start_date date, end_date date, p_professional_id uuid DEFAULT NULL::uuid, p_service_id uuid DEFAULT NULL::uuid, p_partnership_id uuid DEFAULT NULL::uuid)
//    RETURNS TABLE(total_appointments bigint, completed_appointments bigint, cancelled_appointments bigint, cancellation_rate numeric, total_revenue numeric, average_ticket numeric, retention_rate numeric, prev_total_appointments bigint, prev_completed_appointments bigint, prev_cancelled_appointments bigint, prev_cancellation_rate numeric, prev_total_revenue numeric, prev_average_ticket numeric, prev_retention_rate numeric)
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//       period_duration INT;
//       prev_start_date DATE;
//       prev_end_date DATE;
//       
//       curr_revenue NUMERIC;
//       prev_revenue NUMERIC;
//   BEGIN
//       period_duration := end_date - start_date;
//       prev_start_date := start_date - (period_duration + 1) * interval '1 day';
//       prev_end_date := end_date - (period_duration + 1) * interval '1 day';
//   
//       -- Calculate Revenue separately using financial_records for Current Period
//       -- This ensures we capture package purchases, subscription payments and single sessions
//       SELECT COALESCE(SUM(fr.amount), 0) INTO curr_revenue
//       FROM public.financial_records fr
//       LEFT JOIN public.appointments a ON fr.appointment_id = a.id
//       LEFT JOIN public.client_packages cp ON fr.client_package_id = cp.id
//       LEFT JOIN public.packages pkg ON cp.package_id = pkg.id
//       LEFT JOIN public.client_subscriptions cs ON fr.client_subscription_id = cs.id
//       LEFT JOIN public.clients c ON fr.client_id = c.id
//       WHERE fr.payment_date::date BETWEEN start_date AND end_date
//       AND (p_professional_id IS NULL OR fr.professional_id = p_professional_id)
//       AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
//       AND (p_service_id IS NULL OR
//            a.service_id = p_service_id OR
//            pkg.service_id = p_service_id OR
//            cs.service_id = p_service_id
//       );
//   
//       -- Calculate Revenue separately using financial_records for Previous Period
//       SELECT COALESCE(SUM(fr.amount), 0) INTO prev_revenue
//       FROM public.financial_records fr
//       LEFT JOIN public.appointments a ON fr.appointment_id = a.id
//       LEFT JOIN public.client_packages cp ON fr.client_package_id = cp.id
//       LEFT JOIN public.packages pkg ON cp.package_id = pkg.id
//       LEFT JOIN public.client_subscriptions cs ON fr.client_subscription_id = cs.id
//       LEFT JOIN public.clients c ON fr.client_id = c.id
//       WHERE fr.payment_date::date BETWEEN prev_start_date AND prev_end_date
//       AND (p_professional_id IS NULL OR fr.professional_id = p_professional_id)
//       AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
//       AND (p_service_id IS NULL OR
//            a.service_id = p_service_id OR
//            pkg.service_id = p_service_id OR
//            cs.service_id = p_service_id
//       );
//   
//       RETURN QUERY
//       WITH current_aggregates AS (
//           SELECT
//               COUNT(*) AS total_appointments,
//               COUNT(*) FILTER (WHERE status = 'completed') AS completed_appointments,
//               COUNT(*) FILTER (WHERE status IN ('cancelled', 'no_show')) AS cancelled_appointments,
//               COUNT(DISTINCT client_id) AS total_clients,
//               COUNT(DISTINCT client_id) FILTER (
//                   WHERE client_id IN (
//                       SELECT sub_a.client_id
//                       FROM public.appointments sub_a
//                       WHERE sub_a.status = 'completed'
//                       GROUP BY sub_a.client_id
//                       HAVING COUNT(*) > 1
//                   )
//               ) as retained_clients
//           FROM public.appointments a
//           JOIN public.schedules sch ON a.schedule_id = sch.id
//           LEFT JOIN public.clients c ON a.client_id = c.id
//           WHERE sch.start_time::date BETWEEN start_date AND end_date
//           AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
//           AND (p_service_id IS NULL OR a.service_id = p_service_id)
//           AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
//       ),
//       previous_aggregates AS (
//           SELECT
//               COUNT(*) AS prev_total_appointments,
//               COUNT(*) FILTER (WHERE status = 'completed') AS prev_completed_appointments,
//               COUNT(*) FILTER (WHERE status IN ('cancelled', 'no_show')) AS prev_cancelled_appointments,
//               COUNT(DISTINCT client_id) AS prev_total_clients,
//               COUNT(DISTINCT client_id) FILTER (
//                   WHERE client_id IN (
//                       SELECT sub_a.client_id
//                       FROM public.appointments sub_a
//                       WHERE sub_a.status = 'completed'
//                       GROUP BY sub_a.client_id
//                       HAVING COUNT(*) > 1
//                   )
//               ) as prev_retained_clients
//           FROM public.appointments a
//           JOIN public.schedules sch ON a.schedule_id = sch.id
//           LEFT JOIN public.clients c ON a.client_id = c.id
//           WHERE sch.start_time::date BETWEEN prev_start_date AND prev_end_date
//           AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
//           AND (p_service_id IS NULL OR a.service_id = p_service_id)
//           AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
//       )
//       SELECT
//           ca.total_appointments,
//           ca.completed_appointments,
//           ca.cancelled_appointments,
//           CASE
//               WHEN (ca.completed_appointments + ca.cancelled_appointments) > 0
//               THEN (ca.cancelled_appointments::NUMERIC * 100.0 / (ca.completed_appointments + ca.cancelled_appointments))
//               ELSE 0
//           END AS cancellation_rate,
//           curr_revenue AS total_revenue,
//           CASE
//                WHEN ca.completed_appointments > 0 THEN curr_revenue / ca.completed_appointments
//                ELSE 0
//           END AS average_ticket,
//           CASE
//                WHEN ca.total_clients > 0 THEN (ca.retained_clients::NUMERIC * 100.0 / ca.total_clients)
//                ELSE 0
//           END AS retention_rate,
//   
//           pa.prev_total_appointments,
//           pa.prev_completed_appointments,
//           pa.prev_cancelled_appointments,
//           CASE
//               WHEN (pa.prev_completed_appointments + pa.prev_cancelled_appointments) > 0
//               THEN (pa.prev_cancelled_appointments::NUMERIC * 100.0 / (pa.prev_completed_appointments + pa.prev_cancelled_appointments))
//               ELSE 0
//           END AS prev_cancellation_rate,
//           prev_revenue AS prev_total_revenue,
//           CASE
//                WHEN pa.prev_completed_appointments > 0 THEN prev_revenue / pa.prev_completed_appointments
//                ELSE 0
//           END AS prev_average_ticket,
//           CASE
//                WHEN pa.prev_total_clients > 0 THEN (pa.prev_retained_clients::NUMERIC * 100.0 / pa.prev_total_clients)
//                ELSE 0
//           END AS prev_retention_rate
//       FROM current_aggregates ca, previous_aggregates pa;
//   END;
//   $function$
//   
// FUNCTION get_partnership_performance(date, date, uuid, uuid, uuid)
//   CREATE OR REPLACE FUNCTION public.get_partnership_performance(start_date date, end_date date, p_professional_id uuid DEFAULT NULL::uuid, p_service_id uuid DEFAULT NULL::uuid, p_partnership_id uuid DEFAULT NULL::uuid)
//    RETURNS TABLE(partnership_name text, client_count bigint, total_revenue numeric)
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       RETURN QUERY
//       SELECT
//           p.name AS partnership_name,
//           COUNT(DISTINCT a.client_id) AS client_count,
//           COALESCE(SUM(fr.amount), 0) AS total_revenue
//       FROM public.appointments a
//       JOIN public.clients c ON a.client_id = c.id
//       JOIN public.partnerships p ON c.partnership_id = p.id
//       JOIN public.schedules sch ON a.schedule_id = sch.id
//       LEFT JOIN public.financial_records fr ON a.id = fr.appointment_id
//       WHERE a.status = 'completed'
//         AND sch.start_time::date >= start_date
//         AND sch.start_time::date <= end_date
//         AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
//         AND (p_service_id IS NULL OR a.service_id = p_service_id)
//         AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
//       GROUP BY p.name
//       ORDER BY total_revenue DESC;
//   END;
//   $function$
//   
// FUNCTION get_service_performance(date, date, uuid, uuid, uuid)
//   CREATE OR REPLACE FUNCTION public.get_service_performance(start_date date, end_date date, p_professional_id uuid DEFAULT NULL::uuid, p_service_id uuid DEFAULT NULL::uuid, p_partnership_id uuid DEFAULT NULL::uuid)
//    RETURNS TABLE(service_name text, count bigint)
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       RETURN QUERY
//       SELECT
//           s.name AS service_name,
//           COUNT(a.id) AS count
//       FROM public.appointments a
//       JOIN public.services s ON a.service_id = s.id
//       JOIN public.schedules sch ON a.schedule_id = sch.id
//       LEFT JOIN public.clients c ON a.client_id = c.id
//       WHERE a.status = 'completed'
//         AND sch.start_time::date >= start_date
//         AND sch.start_time::date <= end_date
//         AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
//         AND (p_service_id IS NULL OR a.service_id = p_service_id)
//         AND (p_partnership_id IS NULL OR c.partnership_id = p_partnership_id)
//       GROUP BY s.name
//       ORDER BY count DESC;
//   END;
//   $function$
//   
// FUNCTION handle_availability_change_notification()
//   CREATE OR REPLACE FUNCTION public.handle_availability_change_notification()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     record_data RECORD;
//     message_text TEXT;
//   BEGIN
//     IF (TG_OP = 'DELETE') THEN
//       record_data := OLD;
//       message_text := 'Um horário de disponibilidade recorrente foi removido pelo administrador.';
//     ELSE
//       record_data := NEW;
//       IF (TG_OP = 'INSERT') THEN
//         message_text := 'Um novo horário de disponibilidade recorrente foi adicionado pelo administrador.';
//       ELSE -- UPDATE
//         message_text := 'Um horário de disponibilidade recorrente foi alterado pelo administrador.';
//       END IF;
//     END IF;
//   
//     INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
//     VALUES (
//       record_data.professional_id,
//       'admin_override',
//       message_text,
//       record_data.id,
//       '/profissional'
//     );
//   
//     RETURN record_data;
//   END;
//   $function$
//   
// FUNCTION handle_cancellation_notification()
//   CREATE OR REPLACE FUNCTION public.handle_cancellation_notification()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     client_name TEXT;
//     service_name TEXT;
//     appointment_time TIMESTAMPTZ;
//   BEGIN
//     IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
//       SELECT c.name, s.name, sch.start_time
//       INTO client_name, service_name, appointment_time
//       FROM public.clients c
//       JOIN public.services s ON s.id = NEW.service_id
//       JOIN public.schedules sch ON sch.id = NEW.schedule_id
//       WHERE c.id = NEW.client_id;
//   
//       INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
//       VALUES (
//         NEW.professional_id,
//         'cancelled_appointment',
//         'Agendamento cancelado: ' || client_name || ' (' || service_name || ') em ' || to_char(appointment_time, 'DD/MM/YYYY "às" HH24:MI'),
//         NEW.id,
//         '/profissional'
//       );
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_missing_notes_notification()
//   CREATE OR REPLACE FUNCTION public.handle_missing_notes_notification()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     client_name TEXT;
//     appointment_time TIMESTAMPTZ;
//   BEGIN
//     -- Check if the appointment is completed and notes are missing
//     IF NEW.status = 'completed' AND OLD.status <> 'completed' AND NEW.notes IS NULL THEN
//       -- Get client name and appointment time
//       SELECT c.name, s.start_time INTO client_name, appointment_time
//       FROM public.clients c
//       JOIN public.schedules s ON s.id = NEW.schedule_id
//       WHERE c.id = NEW.client_id;
//   
//       -- Insert notification
//       INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
//       VALUES (
//         NEW.professional_id,
//         'missing_notes',
//         'A consulta com ' || COALESCE(client_name, 'Cliente desconhecido') || ' em ' || to_char(appointment_time, 'DD/MM/YYYY "às" HH24:MI') || ' foi concluída e ainda não possui anotações.',
//         NEW.id,
//         '/profissional/pacientes/' || NEW.client_id
//       );
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_new_appointment_notification()
//   CREATE OR REPLACE FUNCTION public.handle_new_appointment_notification()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     client_name TEXT;
//     service_name TEXT;
//     appointment_time TIMESTAMPTZ;
//   BEGIN
//     SELECT c.name, s.name, sch.start_time
//     INTO client_name, service_name, appointment_time
//     FROM public.clients c
//     JOIN public.services s ON s.id = NEW.service_id
//     JOIN public.schedules sch ON sch.id = NEW.schedule_id
//     WHERE c.id = NEW.client_id;
//   
//     INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
//     VALUES (
//       NEW.professional_id,
//       'new_appointment',
//       'Novo agendamento: ' || client_name || ' - ' || service_name || ' em ' || to_char(appointment_time, 'DD/MM/YYYY "às" HH24:MI'),
//       NEW.id,
//       '/profissional/pacientes/' || NEW.client_id
//     );
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_new_service_notification()
//   CREATE OR REPLACE FUNCTION public.handle_new_service_notification()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     service_name TEXT;
//   BEGIN
//     SELECT name INTO service_name FROM public.services WHERE id = NEW.service_id;
//   
//     INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
//     VALUES (
//       NEW.professional_id,
//       'new_service',
//       'Você foi cadastrado para oferecer o novo serviço: ' || service_name || '.',
//       NEW.service_id,
//       '/profissional'
//     );
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id)
//     VALUES (NEW.id)
//     ON CONFLICT (id) DO NOTHING;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_override_change_notification()
//   CREATE OR REPLACE FUNCTION public.handle_override_change_notification()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     record_data RECORD;
//     message_text TEXT;
//   BEGIN
//     IF (TG_OP = 'DELETE') THEN
//       record_data := OLD;
//       message_text := 'Uma exceção de disponibilidade para ' || to_char(record_data.override_date, 'DD/MM/YYYY') || ' foi removida pelo administrador.';
//     ELSE
//       record_data := NEW;
//       IF (TG_OP = 'INSERT') THEN
//         IF record_data.is_available THEN
//           message_text := 'Um novo horário de disponibilidade foi adicionado para ' || to_char(record_data.override_date, 'DD/MM/YYYY') || ' pelo administrador.';
//         ELSE
//           message_text := 'A data ' || to_char(record_data.override_date, 'DD/MM/YYYY') || ' foi bloqueada pelo administrador.';
//         END IF;
//       ELSE -- UPDATE
//         message_text := 'Uma exceção de disponibilidade para ' || to_char(record_data.override_date, 'DD/MM/YYYY') || ' foi alterada pelo administrador.';
//       END IF;
//     END IF;
//   
//     INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
//     VALUES (
//       record_data.professional_id,
//       'admin_override',
//       message_text,
//       record_data.id,
//       '/profissional'
//     );
//   
//     RETURN record_data;
//   END;
//   $function$
//   
// FUNCTION handle_rescheduled_appointment_notification()
//   CREATE OR REPLACE FUNCTION public.handle_rescheduled_appointment_notification()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     client_name TEXT;
//     old_time TIMESTAMPTZ;
//     new_time TIMESTAMPTZ;
//   BEGIN
//     -- Check if schedule_id changed
//     IF NEW.schedule_id <> OLD.schedule_id THEN
//       SELECT name INTO client_name FROM public.clients WHERE id = NEW.client_id;
//       SELECT start_time INTO old_time FROM public.schedules WHERE id = OLD.schedule_id;
//       SELECT start_time INTO new_time FROM public.schedules WHERE id = NEW.schedule_id;
//   
//       INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
//       VALUES (
//         NEW.professional_id,
//         'rescheduled_appointment',
//         'Agendamento remarcado: ' || client_name || ' de ' || to_char(old_time, 'DD/MM/YYYY HH24:MI') || ' para ' || to_char(new_time, 'DD/MM/YYYY HH24:MI'),
//         NEW.id,
//         '/profissional/pacientes/' || NEW.client_id
//       );
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_session_completion()
//   CREATE OR REPLACE FUNCTION public.handle_session_completion()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_new_remaining INT;
//     v_client_name TEXT;
//     v_package_name TEXT;
//     v_admin_id UUID;
//   BEGIN
//     -- Check if status changed to completed and has a package
//     IF NEW.status = 'completed' AND OLD.status <> 'completed' AND NEW.client_package_id IS NOT NULL THEN
//       
//       -- Decrement session
//       UPDATE public.client_packages
//       SET sessions_remaining = sessions_remaining - 1
//       WHERE id = NEW.client_package_id
//       RETURNING sessions_remaining INTO v_new_remaining;
//   
//       -- Get details for notification
//       SELECT c.name, p.name INTO v_client_name, v_package_name
//       FROM public.clients c
//       JOIN public.client_packages cp ON cp.id = NEW.client_package_id
//       JOIN public.packages p ON p.id = cp.package_id
//       WHERE c.id = NEW.client_id;
//   
//       -- Check for Notifications (2 remaining or 1 remaining)
//       IF v_new_remaining = 2 OR v_new_remaining = 1 THEN
//         
//         -- Find all admin professionals
//         FOR v_admin_id IN 
//           SELECT p.id 
//           FROM public.professionals p
//           JOIN public.profiles pr ON pr.id = p.user_id
//           WHERE pr.role = 'admin'
//         LOOP
//           INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
//           VALUES (
//             v_admin_id,
//             'package_renewal',
//             'Alerta de Pacote: O cliente ' || v_client_name || ' possui apenas ' || v_new_remaining || ' sessões restantes no pacote ' || v_package_name || '. Sugerir renovação.',
//             NEW.client_id,
//             '/admin/pacientes/' || NEW.client_id
//           );
//         END LOOP;
//         
//       ELSIF v_new_remaining <= 0 THEN
//          -- Alert for exhaustion
//          FOR v_admin_id IN 
//           SELECT p.id 
//           FROM public.professionals p
//           JOIN public.profiles pr ON pr.id = p.user_id
//           WHERE pr.role = 'admin'
//         LOOP
//           INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
//           VALUES (
//             v_admin_id,
//             'package_renewal',
//             'Pacote Esgotado: O cliente ' || v_client_name || ' finalizou a última sessão do pacote ' || v_package_name || '. Renovação necessária para novos agendamentos.',
//             NEW.client_id,
//             '/admin/pacientes/' || NEW.client_id
//           );
//         END LOOP;
//       END IF;
//   
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION is_admin(uuid)
//   CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
//    RETURNS boolean
//    LANGUAGE sql
//    STABLE
//   AS $function$
//     SELECT EXISTS (
//       SELECT 1 FROM public.profiles p
//       WHERE p.id = uid AND p.role = 'admin'
//     );
//   $function$
//   
// FUNCTION is_admin()
//   CREATE OR REPLACE FUNCTION public.is_admin()
//    RETURNS boolean
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     RETURN EXISTS (
//       SELECT 1
//       FROM public.admins
//       WHERE user_id = auth.uid()
//     );
//   END;
//   $function$
//   
// FUNCTION is_admin_simple(uuid)
//   CREATE OR REPLACE FUNCTION public.is_admin_simple(p_user uuid DEFAULT auth.uid())
//    RETURNS boolean
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     RETURN EXISTS (
//       SELECT 1
//       FROM public.admins
//       WHERE user_id = p_user
//     );
//   END;
//   $function$
//   
// FUNCTION process_missing_notes_notifications()
//   CREATE OR REPLACE FUNCTION public.process_missing_notes_notifications()
//    RETURNS void
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//     appt RECORD;
//   BEGIN
//     -- Iterate over appointments that are completed, have no notes, ended more than 24h ago
//     -- and don't have a notification yet.
//     FOR appt IN
//       SELECT 
//         a.id, 
//         a.professional_id, 
//         a.client_id,
//         s.end_time
//       FROM appointments a
//       JOIN schedules s ON a.schedule_id = s.id
//       WHERE a.status = 'completed'
//         AND (a.notes IS NULL OR jsonb_array_length(a.notes::jsonb) = 0)
//         AND s.end_time::timestamp < (now() - interval '24 hours')
//         AND NOT EXISTS (
//           SELECT 1 FROM professional_notifications pn
//           WHERE pn.related_entity_id = a.id
//             AND pn.type = 'missing_notes'
//         )
//     LOOP
//       INSERT INTO professional_notifications (
//         professional_id,
//         message,
//         type,
//         link,
//         related_entity_id,
//         is_read
//       ) VALUES (
//         appt.professional_id,
//         'Atenção: O agendamento finalizado há mais de 24h está sem anotações de prontuário.',
//         'missing_notes',
//         '/profissional/pacientes/' || appt.client_id,
//         appt.id,
//         false
//       );
//     END LOOP;
//   END;
//   $function$
//   
// FUNCTION reschedule_appointment(uuid, uuid)
//   CREATE OR REPLACE FUNCTION public.reschedule_appointment(p_appointment_id uuid, p_new_schedule_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_new_professional_id UUID;
//     v_service_id UUID;
//     v_max_attendees INT;
//     v_conflict_count INT;
//     v_existing_service_id UUID;
//   BEGIN
//     SELECT service_id INTO v_service_id
//     FROM public.appointments
//     WHERE id = p_appointment_id;
//   
//     IF NOT FOUND THEN
//       RAISE EXCEPTION 'Agendamento não encontrado.';
//     END IF;
//   
//     SELECT max_attendees INTO v_max_attendees
//     FROM public.services
//     WHERE id = v_service_id;
//     
//     v_max_attendees := COALESCE(v_max_attendees, 1);
//   
//     SELECT professional_id INTO v_new_professional_id
//     FROM public.schedules
//     WHERE id = p_new_schedule_id;
//   
//     IF NOT FOUND THEN
//       RAISE EXCEPTION 'Novo horário não encontrado.';
//     END IF;
//   
//     SELECT 
//       count(*),
//       MAX(service_id::text)::uuid
//     INTO 
//       v_conflict_count,
//       v_existing_service_id
//     FROM public.appointments
//     WHERE schedule_id = p_new_schedule_id
//       AND status NOT IN ('cancelled', 'no_show');
//   
//     IF v_conflict_count >= v_max_attendees THEN
//       RAISE EXCEPTION 'Turma lotada: Capacidade máxima atingida (%/%)', v_conflict_count, v_max_attendees;
//     END IF;
//   
//     IF v_conflict_count > 0 AND v_existing_service_id IS NOT NULL AND v_existing_service_id != v_service_id THEN
//       RAISE EXCEPTION 'Conflito de serviço: Este horário já está reservado para outro tipo de serviço.';
//     END IF;
//   
//     UPDATE public.appointments
//     SET
//       schedule_id = p_new_schedule_id,
//       professional_id = v_new_professional_id,
//       status = 'scheduled'
//     WHERE id = p_appointment_id;
//   END;
//   $function$
//   
// FUNCTION reschedule_appointment_dynamic(uuid, uuid, timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.reschedule_appointment_dynamic(p_appointment_id uuid, p_new_professional_id uuid, p_new_start_time timestamp with time zone)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_service_id UUID;
//     v_duration INT;
//     v_end_time TIMESTAMPTZ;
//     v_schedule_id UUID;
//     v_max_attendees INT;
//     v_conflict_count INT;
//     v_existing_service_id UUID;
//   BEGIN
//     -- 1. Get Service Info
//     SELECT service_id INTO v_service_id FROM public.appointments WHERE id = p_appointment_id;
//     IF NOT FOUND THEN RAISE EXCEPTION 'Agendamento não encontrado.'; END IF;
//   
//     SELECT duration_minutes, max_attendees INTO v_duration, v_max_attendees 
//     FROM public.services WHERE id = v_service_id;
//     
//     v_max_attendees := COALESCE(v_max_attendees, 1);
//     v_end_time := p_new_start_time + (v_duration || ' minutes')::interval;
//   
//     -- 2. Find or Create Schedule
//     SELECT id INTO v_schedule_id
//     FROM public.schedules
//     WHERE professional_id = p_new_professional_id
//       AND start_time = p_new_start_time;
//   
//     IF v_schedule_id IS NULL THEN
//       -- Check Staggered Conflicts
//       IF EXISTS (
//           SELECT 1 FROM public.schedules s
//           WHERE s.professional_id = p_new_professional_id
//           AND s.start_time < v_end_time 
//           AND s.end_time > p_new_start_time
//           AND EXISTS (SELECT 1 FROM public.appointments a WHERE a.schedule_id = s.id AND a.status NOT IN ('cancelled', 'no_show'))
//       ) THEN
//            RAISE EXCEPTION 'Conflito de horário com outro agendamento existente.';
//       END IF;
//   
//       INSERT INTO public.schedules (professional_id, start_time, end_time)
//       VALUES (p_new_professional_id, p_new_start_time, v_end_time)
//       RETURNING id INTO v_schedule_id;
//     END IF;
//   
//     -- 3. Validate Capacity and Service on Target Schedule
//     SELECT 
//       count(*),
//       MAX(service_id::text)::uuid
//     INTO 
//       v_conflict_count,
//       v_existing_service_id
//     FROM public.appointments
//     WHERE schedule_id = v_schedule_id
//       AND status NOT IN ('cancelled', 'no_show')
//       AND id != p_appointment_id; -- Exclude self if rescheduling to same slot
//   
//     IF v_conflict_count >= v_max_attendees THEN
//       RAISE EXCEPTION 'Turma lotada: Capacidade máxima atingida (%/%)', v_conflict_count, v_max_attendees;
//     END IF;
//   
//     IF v_conflict_count > 0 AND v_existing_service_id IS NOT NULL AND v_existing_service_id != v_service_id THEN
//       RAISE EXCEPTION 'Conflito de serviço: Este horário já está reservado para outro tipo de serviço.';
//     END IF;
//   
//     -- 4. Update Appointment
//     UPDATE public.appointments
//     SET
//       schedule_id = v_schedule_id,
//       professional_id = p_new_professional_id,
//       status = 'scheduled'
//     WHERE id = p_appointment_id;
//   
//   END;
//   $function$
//   
// FUNCTION rls_auto_enable()
//   CREATE OR REPLACE FUNCTION public.rls_auto_enable()
//    RETURNS event_trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'pg_catalog'
//   AS $function$
//   DECLARE
//     cmd record;
//   BEGIN
//     FOR cmd IN
//       SELECT *
//       FROM pg_event_trigger_ddl_commands()
//       WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
//         AND object_type IN ('table','partitioned table')
//     LOOP
//        IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
//         BEGIN
//           EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
//           RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
//         EXCEPTION
//           WHEN OTHERS THEN
//             RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
//         END;
//        ELSE
//           RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
//        END IF;
//     END LOOP;
//   END;
//   $function$
//   
// FUNCTION sync_admin_role()
//   CREATE OR REPLACE FUNCTION public.sync_admin_role()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF NEW.role = 'admin' THEN
//       INSERT INTO public.admins (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
//     ELSE
//       DELETE FROM public.admins WHERE user_id = NEW.id;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION sync_appointment_financials()
//   CREATE OR REPLACE FUNCTION public.sync_appointment_financials()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//     v_service_price NUMERIC;
//     v_value_type TEXT;
//     v_final_amount NUMERIC;
//   BEGIN
//     -- Check if this is a package or subscription appointment
//     IF NEW.client_package_id IS NOT NULL THEN
//       v_final_amount := 0;
//     ELSE
//       SELECT price, value_type INTO v_service_price, v_value_type FROM services WHERE id = NEW.service_id;
//       
//       IF v_value_type = 'monthly' THEN
//          v_final_amount := 0;
//       ELSE
//          -- Calculate final amount (price - discount), ensuring not negative
//          v_final_amount := GREATEST(0, v_service_price - COALESCE(NEW.discount_amount, 0));
//       END IF;
//     END IF;
//     
//     -- Update financial record if exists
//     UPDATE financial_records 
//     SET amount = v_final_amount
//     WHERE appointment_id = NEW.id;
//     
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION update_updated_at_column()
//   CREATE OR REPLACE FUNCTION public.update_updated_at_column()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       NEW.updated_at = NOW();
//       RETURN NEW;
//   END;
//   $function$
//   

// --- TRIGGERS ---
// Table: appointments
//   trigger_cancellation_notification: CREATE TRIGGER trigger_cancellation_notification AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION handle_cancellation_notification()
//   trigger_missing_notes_notification: CREATE TRIGGER trigger_missing_notes_notification AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION handle_missing_notes_notification()
//   trigger_new_appointment_notification: CREATE TRIGGER trigger_new_appointment_notification AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION handle_new_appointment_notification()
//   trigger_rescheduled_appointment_notification: CREATE TRIGGER trigger_rescheduled_appointment_notification AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION handle_rescheduled_appointment_notification()
//   trigger_session_completion: CREATE TRIGGER trigger_session_completion AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION handle_session_completion()
//   update_financials_on_appointment_change: CREATE TRIGGER update_financials_on_appointment_change AFTER UPDATE OF discount_amount ON public.appointments FOR EACH ROW EXECUTE FUNCTION sync_appointment_financials()
// Table: client_subscriptions
//   update_client_subscriptions_updated_at: CREATE TRIGGER update_client_subscriptions_updated_at BEFORE UPDATE ON public.client_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: professional_availability_overrides
//   trigger_override_availability_change: CREATE TRIGGER trigger_override_availability_change AFTER INSERT OR DELETE OR UPDATE ON public.professional_availability_overrides FOR EACH ROW EXECUTE FUNCTION handle_override_change_notification()
// Table: professional_recurring_availability
//   trigger_recurring_availability_change: CREATE TRIGGER trigger_recurring_availability_change AFTER INSERT OR DELETE OR UPDATE ON public.professional_recurring_availability FOR EACH ROW EXECUTE FUNCTION handle_availability_change_notification()
// Table: professional_services
//   trigger_new_service_notification: CREATE TRIGGER trigger_new_service_notification AFTER INSERT ON public.professional_services FOR EACH ROW EXECUTE FUNCTION handle_new_service_notification()
// Table: profiles
//   sync_admin_role_trigger: CREATE TRIGGER sync_admin_role_trigger AFTER INSERT OR UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION sync_admin_role()

// --- INDEXES ---
// Table: appointments
//   CREATE INDEX appointments_client_id_idx ON public.appointments USING btree (client_id)
//   CREATE INDEX appointments_professional_id_idx ON public.appointments USING btree (professional_id)
// Table: client_subscriptions
//   CREATE INDEX client_subscriptions_client_id_idx ON public.client_subscriptions USING btree (client_id)
//   CREATE INDEX client_subscriptions_service_id_idx ON public.client_subscriptions USING btree (service_id)
//   CREATE INDEX client_subscriptions_status_idx ON public.client_subscriptions USING btree (status)
// Table: clients
//   CREATE UNIQUE INDEX clients_email_key ON public.clients USING btree (email)
//   CREATE INDEX clients_partnership_id_idx ON public.clients USING btree (partnership_id)
//   CREATE UNIQUE INDEX clients_user_id_key ON public.clients USING btree (user_id)
//   CREATE INDEX idx_clients_name ON public.clients USING btree (name)
// Table: financial_records
//   CREATE INDEX financial_records_client_id_idx ON public.financial_records USING btree (client_id)
//   CREATE INDEX financial_records_professional_id_idx ON public.financial_records USING btree (professional_id)
//   CREATE INDEX idx_financial_records_subscription ON public.financial_records USING btree (client_subscription_id)
// Table: partnership_discounts
//   CREATE UNIQUE INDEX partnership_discounts_partnership_id_service_id_key ON public.partnership_discounts USING btree (partnership_id, service_id)
// Table: partnerships
//   CREATE INDEX idx_partnerships_name ON public.partnerships USING btree (name)
//   CREATE UNIQUE INDEX partnerships_name_key ON public.partnerships USING btree (name)
// Table: professional_availability_overrides
//   CREATE INDEX professional_availability_ove_professional_id_override_date_idx ON public.professional_availability_overrides USING btree (professional_id, override_date)
//   CREATE UNIQUE INDEX professional_availability_ove_professional_id_override_date_key ON public.professional_availability_overrides USING btree (professional_id, override_date, start_time, end_time)
// Table: professional_notifications
//   CREATE INDEX professional_notifications_professional_id_idx ON public.professional_notifications USING btree (professional_id)
// Table: professional_recurring_availability
//   CREATE UNIQUE INDEX professional_recurring_availa_professional_id_day_of_week_s_key ON public.professional_recurring_availability USING btree (professional_id, day_of_week, start_time, end_time)
//   CREATE INDEX professional_recurring_availability_professional_id_idx ON public.professional_recurring_availability USING btree (professional_id)
// Table: professionals
//   CREATE INDEX idx_professionals_name ON public.professionals USING btree (name)
//   CREATE UNIQUE INDEX professionals_user_id_key ON public.professionals USING btree (user_id)
// Table: profiles
//   CREATE INDEX idx_profiles_role ON public.profiles USING btree (role)
// Table: schedules
//   CREATE INDEX idx_schedules_start_time ON public.schedules USING btree (start_time)
//   CREATE INDEX schedules_professional_id_start_time_idx ON public.schedules USING btree (professional_id, start_time)
//   CREATE UNIQUE INDEX schedules_professional_id_start_time_key ON public.schedules USING btree (professional_id, start_time)
// Table: services
//   CREATE INDEX idx_services_name ON public.services USING btree (name)
// Table: time_tracking
//   CREATE INDEX idx_time_tracking_professional_date ON public.time_tracking USING btree (professional_id, date)
// Table: user_roles
//   CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role)


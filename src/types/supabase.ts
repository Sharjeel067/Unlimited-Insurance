export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: 'system_admin' | 'sales_manager' | 'sales_agent_licensed' | 'sales_agent_unlicensed' | 'call_center_manager' | 'call_center_agent'
          call_center_id: string | null
          manager_id: string | null
          avatar_url: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: 'system_admin' | 'sales_manager' | 'sales_agent_licensed' | 'sales_agent_unlicensed' | 'call_center_manager' | 'call_center_agent'
          call_center_id?: string | null
          manager_id?: string | null
          avatar_url?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: 'system_admin' | 'sales_manager' | 'sales_agent_licensed' | 'sales_agent_unlicensed' | 'call_center_manager' | 'call_center_agent'
          call_center_id?: string | null
          manager_id?: string | null
          avatar_url?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      call_centers: {
        Row: {
          id: string
          name: string
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          created_at?: string
        }
      }
      pipelines: {
        Row: {
          id: string
          name: string
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          created_at?: string
        }
      }
      stages: {
        Row: {
          id: string
          pipeline_id: string
          name: string
          color_code: string
          order_index: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pipeline_id: string
          name: string
          color_code?: string
          order_index?: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pipeline_id?: string
          name?: string
          color_code?: string
          order_index?: number
          is_default?: boolean
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          submission_id: string | null
          call_center_id: string | null
          user_id: string | null
          first_name: string | null
          last_name: string | null
          stage_id: string | null
          pipeline_id: string | null
          assigned_agent_id: string | null
          buffer_agent_id: string | null
          lead_value: number | null
          phone_number: string | null
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          birth_state: string | null
          driver_license: string | null
          date_of_birth: string | null
          age: number | null
          ssn: string | null
          height: string | null
          weight: string | null
          tobacco_use: boolean | null
          health_conditions: string | null
          medications: string | null
          doctor_name: string | null
          desired_coverage: number | null
          monthly_budget: number | null
          existing_coverage: string | null
          beneficiary_info: Json | null
          draft_date: string | null
          bank_name: string | null
          routing_number: string | null
          account_number: string | null
          created_at: string
          updated_at: string
          last_contacted_at: string | null
        }
        Insert: {
          id?: string
          submission_id?: string | null
          call_center_id?: string | null
          user_id?: string | null
          first_name?: string | null
          last_name?: string | null
          stage_id?: string | null
          pipeline_id?: string | null
          assigned_agent_id?: string | null
          buffer_agent_id?: string | null
          lead_value?: number | null
          phone_number?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          birth_state?: string | null
          driver_license?: string | null
          date_of_birth?: string | null
          age?: number | null
          ssn?: string | null
          height?: string | null
          weight?: string | null
          tobacco_use?: boolean | null
          health_conditions?: string | null
          medications?: string | null
          doctor_name?: string | null
          desired_coverage?: number | null
          monthly_budget?: number | null
          existing_coverage?: string | null
          beneficiary_info?: Json | null
          draft_date?: string | null
          bank_name?: string | null
          routing_number?: string | null
          account_number?: string | null
          created_at?: string
          updated_at?: string
          last_contacted_at?: string | null
        }
        Update: {
          id?: string
          submission_id?: string | null
          call_center_id?: string | null
          user_id?: string | null
          first_name?: string | null
          last_name?: string | null
          stage_id?: string | null
          pipeline_id?: string | null
          assigned_agent_id?: string | null
          buffer_agent_id?: string | null
          lead_value?: number | null
          phone_number?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          birth_state?: string | null
          driver_license?: string | null
          date_of_birth?: string | null
          age?: number | null
          ssn?: string | null
          height?: string | null
          weight?: string | null
          tobacco_use?: boolean | null
          health_conditions?: string | null
          medications?: string | null
          doctor_name?: string | null
          desired_coverage?: number | null
          monthly_budget?: number | null
          existing_coverage?: string | null
          beneficiary_info?: Json | null
          draft_date?: string | null
          bank_name?: string | null
          routing_number?: string | null
          account_number?: string | null
          created_at?: string
          updated_at?: string
          last_contacted_at?: string | null
        }
      }
      lead_notes: {
        Row: {
          id: string
          lead_id: string | null
          user_id: string | null
          content: string
          is_pinned: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          user_id?: string | null
          content: string
          is_pinned?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          user_id?: string | null
          content?: string
          is_pinned?: boolean | null
          created_at?: string
        }
      }
      call_logs: {
        Row: {
          id: string
          lead_id: string | null
          agent_id: string | null
          duration: number | null
          recording_url: string | null
          outcome: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          agent_id?: string | null
          duration?: number | null
          recording_url?: string | null
          outcome?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          agent_id?: string | null
          duration?: number | null
          recording_url?: string | null
          outcome?: string | null
          created_at?: string
        }
      }
      policies: {
        Row: {
          id: string
          lead_id: string | null
          carrier_name: string | null
          policy_number: string | null
          status: string | null
          premium_amount: number | null
          commission_amount: number | null
          application_date: string | null
          effective_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          carrier_name?: string | null
          policy_number?: string | null
          status?: string | null
          premium_amount?: number | null
          commission_amount?: number | null
          application_date?: string | null
          effective_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          carrier_name?: string | null
          policy_number?: string | null
          status?: string | null
          premium_amount?: number | null
          commission_amount?: number | null
          application_date?: string | null
          effective_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

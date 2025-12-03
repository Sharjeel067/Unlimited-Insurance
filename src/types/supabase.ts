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
          first_name: string | null
          last_name: string | null
          stage_id: string | null
          pipeline_id: string | null
          assigned_agent_id: string | null
          lead_value: number | null
          phone_number: string | null
          state: string | null
          created_at: string
          // ... add other fields as needed
        }
        Insert: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          stage_id?: string | null
          pipeline_id?: string | null
          assigned_agent_id?: string | null
          lead_value?: number | null
          phone_number?: string | null
          state?: string | null
          created_at?: string
          [key: string]: any
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          stage_id?: string | null
          pipeline_id?: string | null
          assigned_agent_id?: string | null
          lead_value?: number | null
          phone_number?: string | null
          state?: string | null
          created_at?: string
          [key: string]: any
        }
      }
    }
  }
}

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
          policy_holder_name: string | null
          ghl_name: string | null
          stage_id: string | null
          creation_date: string | null
          deal_value: number | null
          cc_value: number | null
          sales_agent_id: string | null
          writing_number: string | null
          commission_type: string | null
          call_center_of_lead: string | null
          phone_no_of_lead: string | null
          ccpmtws: string | null
          cccbws: string | null
          carrier_status: string | null
          deal_creation_date: string | null
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
          policy_holder_name?: string | null
          ghl_name?: string | null
          stage_id?: string | null
          creation_date?: string | null
          deal_value?: number | null
          cc_value?: number | null
          sales_agent_id?: string | null
          writing_number?: string | null
          commission_type?: string | null
          call_center_of_lead?: string | null
          phone_no_of_lead?: string | null
          ccpmtws?: string | null
          cccbws?: string | null
          carrier_status?: string | null
          deal_creation_date?: string | null
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
          policy_holder_name?: string | null
          ghl_name?: string | null
          stage_id?: string | null
          creation_date?: string | null
          deal_value?: number | null
          cc_value?: number | null
          sales_agent_id?: string | null
          writing_number?: string | null
          commission_type?: string | null
          call_center_of_lead?: string | null
          phone_no_of_lead?: string | null
          ccpmtws?: string | null
          cccbws?: string | null
          carrier_status?: string | null
          deal_creation_date?: string | null
        }
      }
      call_results: {
        Row: {
          id: string
          lead_id: string | null
          submission_id: string | null
          application_submitted: boolean | null
          status: string | null
          notes: string | null
          carrier: string | null
          product_type: string | null
          draft_date: string | null
          submitting_agent: string | null
          licensed_agent_account: string | null
          coverage_amount: number | null
          monthly_premium: number | null
          face_amount: number | null
          submission_date: string | null
          agent_id: string | null
          user_id: string | null
          created_at: string | null
          updated_at: string | null
          buffer_agent: string | null
          agent_who_took_call: string | null
          sent_to_underwriting: boolean | null
          call_source: string | null
          dq_reason: string | null
          new_draft_date: string | null
          is_callback: boolean | null
          is_retention_call: boolean | null
          carrier_attempted_1: string | null
          carrier_attempted_2: string | null
          carrier_attempted_3: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          submission_id?: string | null
          application_submitted?: boolean | null
          status?: string | null
          notes?: string | null
          carrier?: string | null
          product_type?: string | null
          draft_date?: string | null
          submitting_agent?: string | null
          licensed_agent_account?: string | null
          coverage_amount?: number | null
          monthly_premium?: number | null
          face_amount?: number | null
          submission_date?: string | null
          agent_id?: string | null
          user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          buffer_agent?: string | null
          agent_who_took_call?: string | null
          sent_to_underwriting?: boolean | null
          call_source?: string | null
          dq_reason?: string | null
          new_draft_date?: string | null
          is_callback?: boolean | null
          is_retention_call?: boolean | null
          carrier_attempted_1?: string | null
          carrier_attempted_2?: string | null
          carrier_attempted_3?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          submission_id?: string | null
          application_submitted?: boolean | null
          status?: string | null
          notes?: string | null
          carrier?: string | null
          product_type?: string | null
          draft_date?: string | null
          submitting_agent?: string | null
          licensed_agent_account?: string | null
          coverage_amount?: number | null
          monthly_premium?: number | null
          face_amount?: number | null
          submission_date?: string | null
          agent_id?: string | null
          user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          buffer_agent?: string | null
          agent_who_took_call?: string | null
          sent_to_underwriting?: boolean | null
          call_source?: string | null
          dq_reason?: string | null
          new_draft_date?: string | null
          is_callback?: boolean | null
          is_retention_call?: boolean | null
          carrier_attempted_1?: string | null
          carrier_attempted_2?: string | null
          carrier_attempted_3?: string | null
        }
      }
      daily_deal_flow: {
        Row: {
          id: string
          submission_id: string
          client_phone_number: string | null
          lead_vendor: string | null
          date: string | null
          insured_name: string | null
          buffer_agent: string | null
          agent: string | null
          licensed_agent_account: string | null
          status: string | null
          call_result: string | null
          carrier: string | null
          product_type: string | null
          draft_date: string | null
          monthly_premium: number | null
          face_amount: number | null
          from_callback: boolean | null
          notes: string | null
          policy_number: string | null
          carrier_audit: string | null
          product_type_carrier: string | null
          level_or_gi: string | null
          created_at: string | null
          updated_at: string | null
          is_callback: boolean | null
          is_retention_call: boolean | null
          placement_status: string | null
          ghl_location_id: string | null
          ghl_opportunity_id: string | null
          ghlcontactid: string | null
          sync_status: string | null
        }
        Insert: {
          id?: string
          submission_id: string
          client_phone_number?: string | null
          lead_vendor?: string | null
          date?: string | null
          insured_name?: string | null
          buffer_agent?: string | null
          agent?: string | null
          licensed_agent_account?: string | null
          status?: string | null
          call_result?: string | null
          carrier?: string | null
          product_type?: string | null
          draft_date?: string | null
          monthly_premium?: number | null
          face_amount?: number | null
          from_callback?: boolean | null
          notes?: string | null
          policy_number?: string | null
          carrier_audit?: string | null
          product_type_carrier?: string | null
          level_or_gi?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_callback?: boolean | null
          is_retention_call?: boolean | null
          placement_status?: string | null
          ghl_location_id?: string | null
          ghl_opportunity_id?: string | null
          ghlcontactid?: string | null
          sync_status?: string | null
        }
        Update: {
          id?: string
          submission_id?: string
          client_phone_number?: string | null
          lead_vendor?: string | null
          date?: string | null
          insured_name?: string | null
          buffer_agent?: string | null
          agent?: string | null
          licensed_agent_account?: string | null
          status?: string | null
          call_result?: string | null
          carrier?: string | null
          product_type?: string | null
          draft_date?: string | null
          monthly_premium?: number | null
          face_amount?: number | null
          from_callback?: boolean | null
          notes?: string | null
          policy_number?: string | null
          carrier_audit?: string | null
          product_type_carrier?: string | null
          level_or_gi?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_callback?: boolean | null
          is_retention_call?: boolean | null
          placement_status?: string | null
          ghl_location_id?: string | null
          ghl_opportunity_id?: string | null
          ghlcontactid?: string | null
          sync_status?: string | null
        }
      }
      agent_status: {
        Row: {
          user_id: string
          agent_type: string
          status: string
          current_session_id: string | null
          last_activity: string | null
        }
        Insert: {
          user_id: string
          agent_type?: string
          status?: string
          current_session_id?: string | null
          last_activity?: string | null
        }
        Update: {
          user_id?: string
          agent_type?: string
          status?: string
          current_session_id?: string | null
          last_activity?: string | null
        }
      }
      verification_sessions: {
        Row: {
          id: string
          submission_id: string
          status: string
          buffer_agent_id: string | null
          licensed_agent_id: string | null
          total_fields: number | null
          started_at: string | null
          completed_at: string | null
          transferred_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          status?: string
          buffer_agent_id?: string | null
          licensed_agent_id?: string | null
          total_fields?: number | null
          started_at?: string | null
          completed_at?: string | null
          transferred_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          status?: string
          buffer_agent_id?: string | null
          licensed_agent_id?: string | null
          total_fields?: number | null
          started_at?: string | null
          completed_at?: string | null
          transferred_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      verification_items: {
        Row: {
          id: string
          session_id: string
          field_name: string
          field_category: string | null
          original_value: string | null
          verified_value: string | null
          is_verified: boolean
          is_modified: boolean
          notes: string | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          field_name: string
          field_category?: string | null
          original_value?: string | null
          verified_value?: string | null
          is_verified?: boolean
          is_modified?: boolean
          notes?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          field_name?: string
          field_category?: string | null
          original_value?: string | null
          verified_value?: string | null
          is_verified?: boolean
          is_modified?: boolean
          notes?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      call_update: {
        Row: {
          id: string
          lead_id: string | null
          user_id: string | null
          agent_id: string | null
          buffer_agent: string | null
          agent_who_took_call: string | null
          application_submitted: boolean | null
          call_source: string | null
          status: string | null
          notes: string | null
          submission_id: string | null
          dq_reason: string | null
          licensed_agent_account: string | null
          carrier: string | null
          product_type: string | null
          draft_date: string | null
          monthly_premium: number | null
          coverage_amount: number | null
          sent_to_underwriting: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          user_id?: string | null
          agent_id?: string | null
          buffer_agent?: string | null
          agent_who_took_call?: string | null
          application_submitted?: boolean | null
          call_source?: string | null
          status?: string | null
          notes?: string | null
          submission_id?: string | null
          dq_reason?: string | null
          licensed_agent_account?: string | null
          carrier?: string | null
          product_type?: string | null
          draft_date?: string | null
          monthly_premium?: number | null
          coverage_amount?: number | null
          sent_to_underwriting?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          user_id?: string | null
          agent_id?: string | null
          buffer_agent?: string | null
          agent_who_took_call?: string | null
          application_submitted?: boolean | null
          call_source?: string | null
          status?: string | null
          notes?: string | null
          submission_id?: string | null
          dq_reason?: string | null
          licensed_agent_account?: string | null
          carrier?: string | null
          product_type?: string | null
          draft_date?: string | null
          monthly_premium?: number | null
          coverage_amount?: number | null
          sent_to_underwriting?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_call_update: {
        Args: {
          p_submission_id: string
          p_agent_id: string
          p_agent_type: string
          p_agent_name: string
          p_event_type: string
          p_event_details: Record<string, unknown>
          p_verification_session_id: string | null
          p_customer_name: string | null
          p_lead_vendor: string | null
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

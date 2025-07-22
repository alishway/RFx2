export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_generated_outputs: {
        Row: {
          ai_model: string | null
          content_type: string
          generated_at: string
          generated_content: Json
          id: string
          intake_form_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          revision_notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          content_type: string
          generated_at?: string
          generated_content?: Json
          id?: string
          intake_form_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          ai_model?: string | null
          content_type?: string
          generated_at?: string
          generated_content?: Json
          id?: string
          intake_form_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_outputs_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          accepted_at: string | null
          confidence_score: number | null
          created_at: string
          id: string
          intake_form_id: string
          modified_content: Json | null
          section_type: string
          source_message_id: string | null
          status: string
          suggestion_content: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          intake_form_id: string
          modified_content?: Json | null
          section_type: string
          source_message_id?: string | null
          status?: string
          suggestion_content?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          intake_form_id?: string
          modified_content?: Json | null
          section_type?: string
          source_message_id?: string | null
          status?: string
          suggestion_content?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      approval_workflows: {
        Row: {
          assigned_to_role: string
          assigned_to_user: string | null
          current_stage: string
          id: string
          intake_form_id: string
          is_active: boolean
          stage_completed_at: string | null
          stage_notes: string | null
          stage_started_at: string
          user_id: string
        }
        Insert: {
          assigned_to_role: string
          assigned_to_user?: string | null
          current_stage?: string
          id?: string
          intake_form_id: string
          is_active?: boolean
          stage_completed_at?: string | null
          stage_notes?: string | null
          stage_started_at?: string
          user_id: string
        }
        Update: {
          assigned_to_role?: string
          assigned_to_user?: string | null
          current_stage?: string
          id?: string
          intake_form_id?: string
          is_active?: boolean
          stage_completed_at?: string | null
          stage_notes?: string | null
          stage_started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trails: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          extracted_suggestions: Json | null
          id: string
          metadata: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          extracted_suggestions?: Json | null
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          extracted_suggestions?: Json | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          intake_form_id: string
          session_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intake_form_id: string
          session_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intake_form_id?: string
          session_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reports: {
        Row: {
          checklist_results: Json
          critical_flags: number | null
          generated_at: string
          id: string
          intake_form_id: string
          overall_score: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          user_id: string
          warning_flags: number | null
        }
        Insert: {
          checklist_results?: Json
          critical_flags?: number | null
          generated_at?: string
          id?: string
          intake_form_id: string
          overall_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id: string
          warning_flags?: number | null
        }
        Update: {
          checklist_results?: Json
          critical_flags?: number | null
          generated_at?: string
          id?: string
          intake_form_id?: string
          overall_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string
          warning_flags?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reports_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_criteria: {
        Row: {
          ai_suggestion_id: string | null
          created_at: string
          description: string | null
          id: string
          intake_form_id: string
          name: string
          source: string
          type: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          ai_suggestion_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          intake_form_id: string
          name: string
          source?: string
          type: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          ai_suggestion_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          intake_form_id?: string
          name?: string
          source?: string
          type?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      file_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          intake_form_id: string
          mime_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          intake_form_id: string
          mime_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          intake_form_id?: string
          mime_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_attachments_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_documents: {
        Row: {
          approval_notes: string | null
          document_type: string
          file_path: string
          generated_at: string
          generated_by: string
          id: string
          intake_form_id: string
          status: string
          template_used: string
          user_id: string
          version: number
        }
        Insert: {
          approval_notes?: string | null
          document_type: string
          file_path: string
          generated_at?: string
          generated_by: string
          id?: string
          intake_form_id: string
          status?: string
          template_used: string
          user_id: string
          version?: number
        }
        Update: {
          approval_notes?: string | null
          document_type?: string
          file_path?: string
          generated_at?: string
          generated_by?: string
          id?: string
          intake_form_id?: string
          status?: string
          template_used?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_forms: {
        Row: {
          ai_metadata: Json | null
          background: string | null
          budget_tolerance:
            | Database["public"]["Enums"]["budget_tolerance"]
            | null
          commodity_type: string | null
          compliance_flags: Json | null
          created_at: string
          deliverables: Json | null
          end_date: string | null
          estimated_value: number | null
          id: string
          requirements: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["intake_status"]
          tasks: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_metadata?: Json | null
          background?: string | null
          budget_tolerance?:
            | Database["public"]["Enums"]["budget_tolerance"]
            | null
          commodity_type?: string | null
          compliance_flags?: Json | null
          created_at?: string
          deliverables?: Json | null
          end_date?: string | null
          estimated_value?: number | null
          id?: string
          requirements?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["intake_status"]
          tasks?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_metadata?: Json | null
          background?: string | null
          budget_tolerance?:
            | Database["public"]["Enums"]["budget_tolerance"]
            | null
          commodity_type?: string | null
          compliance_flags?: Json | null
          created_at?: string
          deliverables?: Json | null
          end_date?: string | null
          estimated_value?: number | null
          id?: string
          requirements?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["intake_status"]
          tasks?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          organization: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      budget_tolerance: "sensitive" | "moderate" | "flexible"
      intake_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "approved"
        | "rejected"
      user_role: "end_user" | "procurement_lead" | "approver" | "admin"
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
      budget_tolerance: ["sensitive", "moderate", "flexible"],
      intake_status: [
        "draft",
        "submitted",
        "in_review",
        "approved",
        "rejected",
      ],
      user_role: ["end_user", "procurement_lead", "approver", "admin"],
    },
  },
} as const

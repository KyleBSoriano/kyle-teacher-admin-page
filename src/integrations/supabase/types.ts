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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_catalog: {
        Row: {
          aliases: string[] | null
          display_name: string
          ios_bundle_id: string
          key: string
        }
        Insert: {
          aliases?: string[] | null
          display_name: string
          ios_bundle_id: string
          key: string
        }
        Update: {
          aliases?: string[] | null
          display_name?: string
          ios_bundle_id?: string
          key?: string
        }
        Relationships: []
      }
      app_templates: {
        Row: {
          apps: Json
          class_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          period: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          apps?: Json
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          period?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          apps?: Json
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          period?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          class_id: string
          clocked_out_at: string | null
          created_at: string
          id: string
          period: number | null
          school_id: string | null
          status: string
          student_id: string | null
          student_name: string | null
          timestamp: string
        }
        Insert: {
          class_id: string
          clocked_out_at?: string | null
          created_at?: string
          id?: string
          period?: number | null
          school_id?: string | null
          status?: string
          student_id?: string | null
          student_name?: string | null
          timestamp?: string
        }
        Update: {
          class_id?: string
          clocked_out_at?: string | null
          created_at?: string
          id?: string
          period?: number | null
          school_id?: string | null
          status?: string
          student_id?: string | null
          student_name?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      class_apps: {
        Row: {
          app_id: string
          class_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          app_id: string
          class_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          app_id?: string
          class_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_apps_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          active_template_id: string | null
          code: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string
          period: string
          room_number: string | null
          school_id: string | null
          start_time: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          active_template_id?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id: string
          period: string
          room_number?: string | null
          school_id?: string | null
          start_time?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          active_template_id?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          period?: string
          room_number?: string | null
          school_id?: string | null
          start_time?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          preferred_title: string | null
          school_id: string | null
          school_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          preferred_title?: string | null
          school_id?: string | null
          school_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          preferred_title?: string | null
          school_id?: string | null
          school_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          block_type: string | null
          color: string | null
          created_at: string
          description: string | null
          end_time: string
          id: string
          period: string
          schedule_date: string
          school_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          block_type?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          period: string
          schedule_date: string
          school_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          block_type?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          period?: string
          schedule_date?: string
          school_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_presets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          schedule_blocks: Json
          school_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          schedule_blocks?: Json
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          schedule_blocks?: Json
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_presets_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          code: string
          created_at: string
          district: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          district?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          district?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_emails: {
        Row: {
          class_id: string | null
          created_at: string
          email: string
          id: string
          student_name: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          email: string
          id?: string
          student_name?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          email?: string
          id?: string
          student_name?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string | null
          device_id: string | null
          email: string | null
          grade: number | null
          id: string
          name: string
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          email?: string | null
          grade?: number | null
          id: string
          name: string
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          email?: string | null
          grade?: number | null
          id?: string
          name?: string
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_anonymous_attendance: {
        Args: { p_class_id: string; p_student_name?: string }
        Returns: Json
      }
      clock_out_student: {
        Args: { p_class_id: string; p_period?: number; p_student_id: string }
        Returns: Json
      }
      create_or_replace_class_code: {
        Args: { p_class_id: string }
        Returns: string
      }
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      make_class_code: { Args: never; Returns: string }
      make_numeric_code: { Args: { p_len?: number }; Returns: string }
      save_student_email: {
        Args: { p_class_id?: string; p_email: string; p_student_name?: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
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
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const

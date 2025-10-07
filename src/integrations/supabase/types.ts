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
      database: {
        Row: {
          content: string | null
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_gender: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          level: number
          points: number
          ui_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_gender?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          level?: number
          points?: number
          ui_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_gender?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          level?: number
          points?: number
          ui_mode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          answer_time_seconds: number | null
          bonus_points: number | null
          correct_answer: string
          created_at: string
          id: string
          is_correct: boolean
          points_earned: number | null
          question_index: number
          selected_answer: string
          streak_count: number | null
          study_material_id: string
          user_id: string
        }
        Insert: {
          answer_time_seconds?: number | null
          bonus_points?: number | null
          correct_answer: string
          created_at?: string
          id?: string
          is_correct: boolean
          points_earned?: number | null
          question_index: number
          selected_answer: string
          streak_count?: number | null
          study_material_id: string
          user_id: string
        }
        Update: {
          answer_time_seconds?: number | null
          bonus_points?: number | null
          correct_answer?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number | null
          question_index?: number
          selected_answer?: string
          streak_count?: number | null
          study_material_id?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          created_at: string
          current_question: number | null
          current_streak: number | null
          id: string
          max_streak: number | null
          questions_correct: number | null
          questions_total: number | null
          session_completed_at: string | null
          session_started_at: string
          study_material_id: string
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_question?: number | null
          current_streak?: number | null
          id?: string
          max_streak?: number | null
          questions_correct?: number | null
          questions_total?: number | null
          session_completed_at?: string | null
          session_started_at?: string
          study_material_id: string
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_question?: number | null
          current_streak?: number | null
          id?: string
          max_streak?: number | null
          questions_correct?: number | null
          questions_total?: number | null
          session_completed_at?: string | null
          session_started_at?: string
          study_material_id?: string
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_tasks: {
        Row: {
          completed: boolean
          created_at: string
          duration_minutes: number
          id: string
          scheduled_date: string
          scheduled_time: string
          task_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_minutes: number
          id?: string
          scheduled_date: string
          scheduled_time: string
          task_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_minutes?: number
          id?: string
          scheduled_date?: string
          scheduled_time?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_music: {
        Row: {
          added_by: string
          created_at: string | null
          group_id: string
          id: string
          is_playing: boolean | null
          youtube_url: string
        }
        Insert: {
          added_by: string
          created_at?: string | null
          group_id: string
          id?: string
          is_playing?: boolean | null
          youtube_url: string
        }
        Update: {
          added_by?: string
          created_at?: string | null
          group_id?: string
          id?: string
          is_playing?: boolean | null
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_music_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_sessions: {
        Row: {
          created_at: string
          date: string
          duration_minutes: number
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          duration_minutes: number
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          duration_minutes?: number
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invite_code: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          corrected_text: string | null
          created_at: string
          flashcards: Json | null
          id: string
          key_concepts: string[] | null
          original_content: string | null
          points_earned: number | null
          quiz: Json | null
          source_type: string
          sources: string[] | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          corrected_text?: string | null
          created_at?: string
          flashcards?: Json | null
          id?: string
          key_concepts?: string[] | null
          original_content?: string | null
          points_earned?: number | null
          quiz?: Json | null
          source_type: string
          sources?: string[] | null
          summary?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          corrected_text?: string | null
          created_at?: string
          flashcards?: Json | null
          id?: string
          key_concepts?: string[] | null
          original_content?: string | null
          points_earned?: number | null
          quiz?: Json | null
          source_type?: string
          sources?: string[] | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          date: string
          duration_minutes: number
          id: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          duration_minutes: number
          id?: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          duration_minutes?: number
          id?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      study_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_study_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_study_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_study_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          generations_used: number | null
          id: string
          product_id: string | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          generations_used?: number | null
          id?: string
          product_id?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          generations_used?: number | null
          id?: string
          product_id?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          difficulty: number | null
          due_date: string
          id: string
          notes: string | null
          priority_order: number
          subject: string
          task_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          difficulty?: number | null
          due_date: string
          id?: string
          notes?: string | null
          priority_order?: number
          subject: string
          task_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          difficulty?: number | null
          due_date?: string
          id?: string
          notes?: string | null
          priority_order?: number
          subject?: string
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_friend_codes: {
        Row: {
          created_at: string | null
          friend_code: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_code?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_code?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      wrong_answers: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          mastered: boolean | null
          question_data: Json
          retry_count: number | null
          selected_answer: string
          study_material_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          mastered?: boolean | null
          question_data: Json
          retry_count?: number | null
          selected_answer: string
          study_material_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          mastered?: boolean | null
          question_data?: Json
          retry_count?: number | null
          selected_answer?: string
          study_material_id?: string
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
      is_group_member: {
        Args: { group_id_param: string; user_id_param: string }
        Returns: boolean
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
    Enums: {},
  },
} as const

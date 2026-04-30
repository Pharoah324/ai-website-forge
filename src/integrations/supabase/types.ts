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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      credit_ledger: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["credit_kind"]
          reason: Database["public"]["Enums"]["ledger_reason"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["credit_kind"]
          reason: Database["public"]["Enums"]["ledger_reason"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["credit_kind"]
          reason?: Database["public"]["Enums"]["ledger_reason"]
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          location_id: string | null
          metadata: Json | null
          pipeline_id: string | null
          platform: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          metadata?: Json | null
          pipeline_id?: string | null
          platform: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          metadata?: Json | null
          pipeline_id?: string | null
          platform?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_cycle_start: string
          billing_interval: string
          brand_voice_active: boolean
          brand_voice_samples: string | null
          build_credits: number
          build_credits_rollover: number
          created_at: string
          current_period_start: string
          display_name: string | null
          email: string | null
          id: string
          monthly_build_limit: number
          monthly_runtime_limit: number
          plan: Database["public"]["Enums"]["plan_tier"]
          rollover_build_credits: number
          rollover_runtime_credits: number
          runtime_credits: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          top_up_build_credits: number
          top_up_runtime_credits: number
          updated_at: string
          voice_rules: Json | null
        }
        Insert: {
          avatar_url?: string | null
          billing_cycle_start?: string
          billing_interval?: string
          brand_voice_active?: boolean
          brand_voice_samples?: string | null
          build_credits?: number
          build_credits_rollover?: number
          created_at?: string
          current_period_start?: string
          display_name?: string | null
          email?: string | null
          id: string
          monthly_build_limit?: number
          monthly_runtime_limit?: number
          plan?: Database["public"]["Enums"]["plan_tier"]
          rollover_build_credits?: number
          rollover_runtime_credits?: number
          runtime_credits?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          top_up_build_credits?: number
          top_up_runtime_credits?: number
          updated_at?: string
          voice_rules?: Json | null
        }
        Update: {
          avatar_url?: string | null
          billing_cycle_start?: string
          billing_interval?: string
          brand_voice_active?: boolean
          brand_voice_samples?: string | null
          build_credits?: number
          build_credits_rollover?: number
          created_at?: string
          current_period_start?: string
          display_name?: string | null
          email?: string | null
          id?: string
          monthly_build_limit?: number
          monthly_runtime_limit?: number
          plan?: Database["public"]["Enums"]["plan_tier"]
          rollover_build_credits?: number
          rollover_runtime_credits?: number
          runtime_credits?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          top_up_build_credits?: number
          top_up_runtime_credits?: number
          updated_at?: string
          voice_rules?: Json | null
        }
        Relationships: []
      }
      site_feedback: {
        Row: {
          author_name: string
          created_at: string
          id: string
          message: string
          section: string | null
          site_id: string
        }
        Insert: {
          author_name?: string
          created_at?: string
          id?: string
          message: string
          section?: string | null
          site_id: string
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          message?: string
          section?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_feedback_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_shared: boolean
          name: string
          prompt: string
          share_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_shared?: boolean
          name?: string
          prompt: string
          share_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_shared?: boolean
          name?: string
          prompt?: string
          share_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          id: string
          processed_at: string
          type: string
        }
        Insert: {
          id: string
          processed_at?: string
          type: string
        }
        Update: {
          id?: string
          processed_at?: string
          type?: string
        }
        Relationships: []
      }
      stripe_products: {
        Row: {
          active: boolean
          amount_cents: number
          build_credits: number
          created_at: string
          id: string
          interval: string | null
          kind: string
          pack_id: string | null
          plan_tier: string | null
          runtime_credits: number
          stripe_price_id: string
          stripe_product_id: string
        }
        Insert: {
          active?: boolean
          amount_cents: number
          build_credits?: number
          created_at?: string
          id?: string
          interval?: string | null
          kind: string
          pack_id?: string | null
          plan_tier?: string | null
          runtime_credits?: number
          stripe_price_id: string
          stripe_product_id: string
        }
        Update: {
          active?: boolean
          amount_cents?: number
          build_credits?: number
          created_at?: string
          id?: string
          interval?: string | null
          kind?: string
          pack_id?: string | null
          plan_tier?: string | null
          runtime_credits?: number
          stripe_price_id?: string
          stripe_product_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      credit_kind: "build" | "runtime"
      ledger_reason:
        | "generate"
        | "topup"
        | "monthly_grant"
        | "rollover"
        | "plan_change"
        | "admin_adjust"
      plan_tier: "free" | "starter" | "builder" | "pro" | "agency"
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
      credit_kind: ["build", "runtime"],
      ledger_reason: [
        "generate",
        "topup",
        "monthly_grant",
        "rollover",
        "plan_change",
        "admin_adjust",
      ],
      plan_tier: ["free", "starter", "builder", "pro", "agency"],
    },
  },
} as const

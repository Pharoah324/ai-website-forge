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
      admin_users: {
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
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          method: string
          notes: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          active_subscribers: number
          affiliate_code: string
          created_at: string
          email: string
          expected_referrals: string | null
          full_name: string
          id: string
          paid_out_total: number
          paypal_email: string
          pending_payout: number
          promotion_plan: string | null
          status: Database["public"]["Enums"]["affiliate_status"]
          tier: Database["public"]["Enums"]["affiliate_tier"]
          total_earnings: number
          total_referrals: number
          updated_at: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          active_subscribers?: number
          affiliate_code: string
          created_at?: string
          email: string
          expected_referrals?: string | null
          full_name: string
          id?: string
          paid_out_total?: number
          paypal_email: string
          pending_payout?: number
          promotion_plan?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          tier?: Database["public"]["Enums"]["affiliate_tier"]
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          active_subscribers?: number
          affiliate_code?: string
          created_at?: string
          email?: string
          expected_referrals?: string | null
          full_name?: string
          id?: string
          paid_out_total?: number
          paypal_email?: string
          pending_payout?: number
          promotion_plan?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          tier?: Database["public"]["Enums"]["affiliate_tier"]
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
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
      referral_conversions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          monthly_value: number
          plan_subscribed: string
          referred_user_id: string
          status: Database["public"]["Enums"]["conversion_status"]
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          monthly_value?: number
          plan_subscribed: string
          referred_user_id: string
          status?: Database["public"]["Enums"]["conversion_status"]
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          monthly_value?: number
          plan_subscribed?: string
          referred_user_id?: string
          status?: Database["public"]["Enums"]["conversion_status"]
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
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
          published: boolean
          published_at: string | null
          share_token: string | null
          subdomain: string | null
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
          published?: boolean
          published_at?: string | null
          share_token?: string | null
          subdomain?: string | null
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
          published?: boolean
          published_at?: string | null
          share_token?: string | null
          subdomain?: string | null
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
      generate_affiliate_code: { Args: never; Returns: string }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      affiliate_status: "pending" | "active" | "suspended"
      affiliate_tier: "starter" | "pro" | "elite" | "agency_partner"
      conversion_status: "pending" | "confirmed" | "paid"
      credit_kind: "build" | "runtime"
      ledger_reason:
        | "generate"
        | "topup"
        | "monthly_grant"
        | "rollover"
        | "plan_change"
        | "admin_adjust"
      payout_status: "pending" | "processing" | "paid" | "failed"
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
      affiliate_status: ["pending", "active", "suspended"],
      affiliate_tier: ["starter", "pro", "elite", "agency_partner"],
      conversion_status: ["pending", "confirmed", "paid"],
      credit_kind: ["build", "runtime"],
      ledger_reason: [
        "generate",
        "topup",
        "monthly_grant",
        "rollover",
        "plan_change",
        "admin_adjust",
      ],
      payout_status: ["pending", "processing", "paid", "failed"],
      plan_tier: ["free", "starter", "builder", "pro", "agency"],
    },
  },
} as const

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
      access_code_redemptions: {
        Row: {
          code_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      access_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          credits_granted: number
          expires_at: string | null
          id: string
          max_uses: number
          notes: string | null
          plan_granted: string
          runtime_credits_granted: number
          times_used: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          credits_granted?: number
          expires_at?: string | null
          id?: string
          max_uses?: number
          notes?: string | null
          plan_granted?: string
          runtime_credits_granted?: number
          times_used?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          credits_granted?: number
          expires_at?: string | null
          id?: string
          max_uses?: number
          notes?: string | null
          plan_granted?: string
          runtime_credits_granted?: number
          times_used?: number
        }
        Relationships: []
      }
      admin_alerts: {
        Row: {
          action_notes: string | null
          affected_user_email: string | null
          affected_user_id: string | null
          alert_type: Database["public"]["Enums"]["admin_alert_type"]
          created_at: string
          description: string
          id: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: Database["public"]["Enums"]["admin_alert_severity"]
          status: Database["public"]["Enums"]["admin_alert_status"]
          updated_at: string
        }
        Insert: {
          action_notes?: string | null
          affected_user_email?: string | null
          affected_user_id?: string | null
          alert_type: Database["public"]["Enums"]["admin_alert_type"]
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["admin_alert_severity"]
          status?: Database["public"]["Enums"]["admin_alert_status"]
          updated_at?: string
        }
        Update: {
          action_notes?: string | null
          affected_user_email?: string | null
          affected_user_id?: string | null
          alert_type?: Database["public"]["Enums"]["admin_alert_type"]
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["admin_alert_severity"]
          status?: Database["public"]["Enums"]["admin_alert_status"]
          updated_at?: string
        }
        Relationships: []
      }
      admin_usage_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          log_id: string
          notes: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          log_id?: string
          notes?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          log_id?: string
          notes?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          access_level: Database["public"]["Enums"]["admin_access_level"]
          added_by: string | null
          created_at: string
          email: string | null
          last_active: string | null
          name: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["admin_access_level"]
          added_by?: string | null
          created_at?: string
          email?: string | null
          last_active?: string | null
          name?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["admin_access_level"]
          added_by?: string | null
          created_at?: string
          email?: string | null
          last_active?: string | null
          name?: string | null
          notes?: string | null
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
      announcements: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          message: string
          variant: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message: string
          variant?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          variant?: string
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
      credit_transactions: {
        Row: {
          amount_changed: number
          created_at: string
          credit_kind: string
          credits_after: number
          credits_before: number
          metadata: Json | null
          reason: string
          transaction_id: string
          transaction_type: Database["public"]["Enums"]["credit_txn_type"]
          user_id: string
        }
        Insert: {
          amount_changed: number
          created_at?: string
          credit_kind?: string
          credits_after: number
          credits_before: number
          metadata?: Json | null
          reason: string
          transaction_id?: string
          transaction_type: Database["public"]["Enums"]["credit_txn_type"]
          user_id: string
        }
        Update: {
          amount_changed?: number
          created_at?: string
          credit_kind?: string
          credits_after?: number
          credits_before?: number
          metadata?: Json | null
          reason?: string
          transaction_id?: string
          transaction_type?: Database["public"]["Enums"]["credit_txn_type"]
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
      job_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          credit_refunded: boolean
          error_message: string | null
          job_id: string
          job_type: string
          max_attempts: number
          next_retry_at: string | null
          payload: Json | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          credit_refunded?: boolean
          error_message?: string | null
          job_id?: string
          job_type: string
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          credit_refunded?: boolean
          error_message?: string | null
          job_id?: string
          job_type?: string
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      optimization_projects: {
        Row: {
          created_at: string
          id: string
          integrations: Json
          last_analyzed_at: string | null
          latest_report: Json | null
          name: string
          status: string
          updated_at: string
          user_id: string
          website_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          integrations?: Json
          last_analyzed_at?: string | null
          latest_report?: Json | null
          name?: string
          status?: string
          updated_at?: string
          user_id: string
          website_url: string
        }
        Update: {
          created_at?: string
          id?: string
          integrations?: Json
          last_analyzed_at?: string | null
          latest_report?: Json | null
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
          website_url?: string
        }
        Relationships: []
      }
      optimization_reports: {
        Row: {
          created_at: string
          id: string
          project_id: string
          report: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          report: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          report?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "optimization_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_caps: {
        Row: {
          daily_optimization_runs: number
          daily_site_generations: number
          gsc_enabled: boolean
          hourly_api_calls: number
          max_optimization_reports: number
          max_sites: number
          max_upload_mb: number
          plan: string
          search_atlas_enabled: boolean
        }
        Insert: {
          daily_optimization_runs: number
          daily_site_generations: number
          gsc_enabled?: boolean
          hourly_api_calls: number
          max_optimization_reports: number
          max_sites: number
          max_upload_mb: number
          plan: string
          search_atlas_enabled?: boolean
        }
        Update: {
          daily_optimization_runs?: number
          daily_site_generations?: number
          gsc_enabled?: boolean
          hourly_api_calls?: number
          max_optimization_reports?: number
          max_sites?: number
          max_upload_mb?: number
          plan?: string
          search_atlas_enabled?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_cycle_start: string
          billing_interval: string
          billing_status: string
          brand_voice_active: boolean
          brand_voice_samples: string | null
          build_credits: number
          build_credits_rollover: number
          created_at: string
          current_period_start: string
          display_name: string | null
          dispute_flagged: boolean
          email: string | null
          grace_period_ends_at: string | null
          id: string
          last_invoice_id: string | null
          monthly_build_limit: number
          monthly_runtime_limit: number
          payment_failed_at: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          plan_before_downgrade: string | null
          role: Database["public"]["Enums"]["user_role"]
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
          billing_status?: string
          brand_voice_active?: boolean
          brand_voice_samples?: string | null
          build_credits?: number
          build_credits_rollover?: number
          created_at?: string
          current_period_start?: string
          display_name?: string | null
          dispute_flagged?: boolean
          email?: string | null
          grace_period_ends_at?: string | null
          id: string
          last_invoice_id?: string | null
          monthly_build_limit?: number
          monthly_runtime_limit?: number
          payment_failed_at?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          plan_before_downgrade?: string | null
          role?: Database["public"]["Enums"]["user_role"]
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
          billing_status?: string
          brand_voice_active?: boolean
          brand_voice_samples?: string | null
          build_credits?: number
          build_credits_rollover?: number
          created_at?: string
          current_period_start?: string
          display_name?: string | null
          dispute_flagged?: boolean
          email?: string | null
          grace_period_ends_at?: string | null
          id?: string
          last_invoice_id?: string | null
          monthly_build_limit?: number
          monthly_runtime_limit?: number
          payment_failed_at?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          plan_before_downgrade?: string | null
          role?: Database["public"]["Enums"]["user_role"]
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
      rate_limits: {
        Row: {
          action_type: Database["public"]["Enums"]["rate_action"]
          blocked_until: string | null
          count_this_hour: number
          count_today: number
          day_window_start: string
          hour_window_start: string
          id: string
          last_reset_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["rate_action"]
          blocked_until?: string | null
          count_this_hour?: number
          count_today?: number
          day_window_start?: string
          hour_window_start?: string
          id?: string
          last_reset_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["rate_action"]
          blocked_until?: string | null
          count_this_hour?: number
          count_today?: number
          day_window_start?: string
          hour_window_start?: string
          id?: string
          last_reset_at?: string
          updated_at?: string
          user_id?: string
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
      check_and_consume: {
        Args: {
          _action: Database["public"]["Enums"]["rate_action"]
          _credit_cost?: number
          _uid: string
        }
        Returns: Json
      }
      downgrade_past_due_users: { Args: never; Returns: Json }
      generate_affiliate_code: { Args: never; Returns: string }
      get_admin_level: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["admin_access_level"]
      }
      get_effective_plan: { Args: { _uid: string }; Returns: string }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      redeem_access_code: { Args: { _code: string }; Returns: Json }
      refund_credits: {
        Args: {
          _amount: number
          _description?: string
          _reason: string
          _uid: string
        }
        Returns: Json
      }
    }
    Enums: {
      admin_access_level: "super_admin" | "admin" | "support"
      admin_alert_severity: "critical" | "warning" | "info"
      admin_alert_status: "new" | "reviewed" | "resolved"
      admin_alert_type:
        | "dispute"
        | "abuse"
        | "server_error"
        | "credit_anomaly"
        | "signup_abuse"
        | "other"
        | "payment_failed"
        | "grace_period_expired"
        | "subscription_canceled"
      affiliate_status: "pending" | "active" | "suspended"
      affiliate_tier: "starter" | "pro" | "elite" | "agency_partner"
      conversion_status: "pending" | "confirmed" | "paid"
      credit_kind: "build" | "runtime"
      credit_txn_type:
        | "deduction"
        | "addition"
        | "rollover"
        | "topup"
        | "reset"
        | "refund"
      job_status: "pending" | "processing" | "completed" | "failed" | "retrying"
      ledger_reason:
        | "generate"
        | "topup"
        | "monthly_grant"
        | "rollover"
        | "plan_change"
        | "admin_adjust"
      payout_status: "pending" | "processing" | "paid" | "failed"
      plan_tier: "free" | "starter" | "builder" | "pro" | "agency"
      rate_action:
        | "site_generation"
        | "optimization_run"
        | "api_call"
        | "ghl_sync"
        | "search_atlas_call"
      user_role: "user" | "admin" | "agency" | "affiliate"
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
      admin_access_level: ["super_admin", "admin", "support"],
      admin_alert_severity: ["critical", "warning", "info"],
      admin_alert_status: ["new", "reviewed", "resolved"],
      admin_alert_type: [
        "dispute",
        "abuse",
        "server_error",
        "credit_anomaly",
        "signup_abuse",
        "other",
        "payment_failed",
        "grace_period_expired",
        "subscription_canceled",
      ],
      affiliate_status: ["pending", "active", "suspended"],
      affiliate_tier: ["starter", "pro", "elite", "agency_partner"],
      conversion_status: ["pending", "confirmed", "paid"],
      credit_kind: ["build", "runtime"],
      credit_txn_type: [
        "deduction",
        "addition",
        "rollover",
        "topup",
        "reset",
        "refund",
      ],
      job_status: ["pending", "processing", "completed", "failed", "retrying"],
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
      rate_action: [
        "site_generation",
        "optimization_run",
        "api_call",
        "ghl_sync",
        "search_atlas_call",
      ],
      user_role: ["user", "admin", "agency", "affiliate"],
    },
  },
} as const

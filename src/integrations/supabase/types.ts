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
      announcements: {
        Row: {
          active: boolean | null
          content: string
          created_at: string | null
          created_by: string | null
          expire_at: string | null
          id: string
          placement: string | null
          start_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          content: string
          created_at?: string | null
          created_by?: string | null
          expire_at?: string | null
          id?: string
          placement?: string | null
          start_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          expire_at?: string | null
          id?: string
          placement?: string | null
          start_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          end_at: string | null
          goal_amount: number
          id: string
          image_url: string | null
          raised_amount: number | null
          start_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          goal_amount: number
          id?: string
          image_url?: string | null
          raised_amount?: number | null
          start_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          goal_amount?: number
          id?: string
          image_url?: string | null
          raised_amount?: number | null
          start_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          anonymous: boolean | null
          campaign_id: string | null
          created_at: string | null
          currency: string | null
          donor_email: string
          donor_id: string | null
          donor_name: string
          donor_phone: string | null
          id: string
          notes: string | null
          payment_id: string | null
          payment_provider: string | null
          receipt_url: string | null
          recurring: boolean | null
          recurring_frequency: string | null
          status: Database["public"]["Enums"]["donation_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          anonymous?: boolean | null
          campaign_id?: string | null
          created_at?: string | null
          currency?: string | null
          donor_email: string
          donor_id?: string | null
          donor_name: string
          donor_phone?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          receipt_url?: string | null
          recurring?: boolean | null
          recurring_frequency?: string | null
          status?: Database["public"]["Enums"]["donation_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          anonymous?: boolean | null
          campaign_id?: string | null
          created_at?: string | null
          currency?: string | null
          donor_email?: string
          donor_id?: string | null
          donor_name?: string
          donor_phone?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          receipt_url?: string | null
          recurring?: boolean | null
          recurring_frequency?: string | null
          status?: Database["public"]["Enums"]["donation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attendees: number | null
          created_at: string | null
          event_id: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          attendees?: number | null
          created_at?: string | null
          event_id: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          attendees?: number | null
          created_at?: string | null
          event_id?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_at: string
          id: string
          image_url: string | null
          livestream_url: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          price: number | null
          registration_open: boolean | null
          slug: string
          start_at: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_at: string
          id?: string
          image_url?: string | null
          livestream_url?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          price?: number | null
          registration_open?: boolean | null
          slug: string
          start_at: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_at?: string
          id?: string
          image_url?: string | null
          livestream_url?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          price?: number | null
          registration_open?: boolean | null
          slug?: string
          start_at?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          created_at: string | null
          created_by: string | null
          file_size: number | null
          file_type: string | null
          id: string
          public_url: string
          storage_path: string
          title: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          created_by?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          public_url: string
          storage_path: string
          title?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          created_by?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          public_url?: string
          storage_path?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string | null
          guest_email: string | null
          id: string
          payment_id: string | null
          payment_provider: string | null
          shipping_address: string
          shipping_city: string
          shipping_name: string
          shipping_phone: string
          shipping_pincode: string
          shipping_state: string
          status: Database["public"]["Enums"]["order_status"] | null
          total: number
          tracking_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          guest_email?: string | null
          id?: string
          payment_id?: string | null
          payment_provider?: string | null
          shipping_address: string
          shipping_city: string
          shipping_name: string
          shipping_phone: string
          shipping_pincode: string
          shipping_state: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          guest_email?: string | null
          id?: string
          payment_id?: string | null
          payment_provider?: string | null
          shipping_address?: string
          shipping_city?: string
          shipping_name?: string
          shipping_phone?: string
          shipping_pincode?: string
          shipping_state?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published: boolean | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          images: string[] | null
          inventory: number | null
          price: number
          sku: string
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          inventory?: number | null
          price: number
          sku: string
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          inventory?: number | null
          price?: number
          sku?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          active: boolean | null
          created_at: string | null
          day_of_week: number | null
          description: string | null
          event_name: string
          event_time: string
          id: string
          special_date: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          day_of_week?: number | null
          description?: string | null
          event_name: string
          event_time: string
          id?: string
          special_date?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          day_of_week?: number | null
          description?: string | null
          event_name?: string
          event_time?: string
          id?: string
          special_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "editor" | "manager" | "superadmin"
      donation_status: "pending" | "completed" | "failed" | "refunded"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
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
      app_role: ["user", "editor", "manager", "superadmin"],
      donation_status: ["pending", "completed", "failed", "refunded"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const

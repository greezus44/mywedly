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
      budget_items: {
        Row: {
          actual_cents: number
          category: string
          created_at: string
          estimated_cents: number
          id: string
          is_paid: boolean
          label: string
          wedding_id: string
        }
        Insert: {
          actual_cents?: number
          category: string
          created_at?: string
          estimated_cents?: number
          id?: string
          is_paid?: boolean
          label: string
          wedding_id: string
        }
        Update: {
          actual_cents?: number
          category?: string
          created_at?: string
          estimated_cents?: number
          id?: string
          is_paid?: boolean
          label?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_tasks: {
        Row: {
          category: string | null
          created_at: string
          due_date: string | null
          id: string
          is_done: boolean
          sort_order: number
          title: string
          wedding_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          sort_order?: number
          title: string
          wedding_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          sort_order?: number
          title?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_tasks_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          dress_code: string | null
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          name: string
          notes: string | null
          sort_order: number
          starts_at: string | null
          venue_address: string | null
          venue_name: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
          wedding_id: string
        }
        Insert: {
          created_at?: string
          dress_code?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          name: string
          notes?: string | null
          sort_order?: number
          starts_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
          wedding_id: string
        }
        Update: {
          created_at?: string
          dress_code?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          name?: string
          notes?: string | null
          sort_order?: number
          starts_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_items: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_approved: boolean
          is_featured: boolean
          uploader_name: string | null
          wedding_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_approved?: boolean
          is_featured?: boolean
          uploader_name?: string | null
          wedding_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_approved?: boolean
          is_featured?: boolean
          uploader_name?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guestbook_entries: {
        Row: {
          author_name: string
          created_at: string
          id: string
          is_approved: boolean
          message: string
          wedding_id: string
        }
        Insert: {
          author_name: string
          created_at?: string
          id?: string
          is_approved?: boolean
          message: string
          wedding_id: string
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          message?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guestbook_entries_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          group_label: string | null
          id: string
          invite_code: string | null
          notes: string | null
          phone: string | null
          plus_one_allowed: boolean
          tag: string | null
          wedding_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          group_label?: string | null
          id?: string
          invite_code?: string | null
          notes?: string | null
          phone?: string | null
          plus_one_allowed?: boolean
          tag?: string | null
          wedding_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          group_label?: string | null
          id?: string
          invite_code?: string | null
          notes?: string | null
          phone?: string | null
          plus_one_allowed?: boolean
          tag?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      registry_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_cash_fund: boolean
          price_cents: number | null
          sort_order: number
          title: string
          url: string | null
          wedding_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_cash_fund?: boolean
          price_cents?: number | null
          sort_order?: number
          title: string
          url?: string | null
          wedding_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_cash_fund?: boolean
          price_cents?: number | null
          sort_order?: number
          title?: string
          url?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_items_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string
          dietary_restrictions: string | null
          event_id: string | null
          guest_email: string | null
          guest_id: string | null
          guest_name: string
          id: string
          meal_choice: string | null
          message: string | null
          plus_one_name: string | null
          song_request: string | null
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          dietary_restrictions?: string | null
          event_id?: string | null
          guest_email?: string | null
          guest_id?: string | null
          guest_name: string
          id?: string
          meal_choice?: string | null
          message?: string | null
          plus_one_name?: string | null
          song_request?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          dietary_restrictions?: string | null
          event_id?: string | null
          guest_email?: string | null
          guest_id?: string | null
          guest_name?: string
          id?: string
          meal_choice?: string | null
          message?: string | null
          plus_one_name?: string | null
          song_request?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_items: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["travel_kind"]
          sort_order: number
          title: string
          url: string | null
          wedding_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["travel_kind"]
          sort_order?: number
          title: string
          url?: string | null
          wedding_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["travel_kind"]
          sort_order?: number
          title?: string
          url?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_items_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["wedding_role"]
          user_id: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["wedding_role"]
          user_id: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["wedding_role"]
          user_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_members_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          content: Json
          couple_name_one: string
          couple_name_two: string
          created_at: string
          created_by: string
          hashtag: string | null
          hero_image_url: string | null
          id: string
          is_published: boolean
          location: string | null
          slug: string
          story: string | null
          theme: string
          updated_at: string
          wedding_date: string | null
        }
        Insert: {
          content?: Json
          couple_name_one: string
          couple_name_two: string
          created_at?: string
          created_by: string
          hashtag?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          slug: string
          story?: string | null
          theme?: string
          updated_at?: string
          wedding_date?: string | null
        }
        Update: {
          content?: Json
          couple_name_one?: string
          couple_name_two?: string
          created_at?: string
          created_by?: string
          hashtag?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          slug?: string
          story?: string | null
          theme?: string
          updated_at?: string
          wedding_date?: string | null
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
      event_kind:
        | "ceremony"
        | "reception"
        | "welcome"
        | "rehearsal"
        | "brunch"
        | "cultural"
        | "other"
      event_visibility: "public" | "private"
      rsvp_status: "pending" | "accepted" | "declined" | "tentative"
      travel_kind:
        | "hotel"
        | "airport"
        | "parking"
        | "transport"
        | "attraction"
        | "restaurant"
      wedding_role: "owner" | "planner" | "viewer"
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
      event_kind: [
        "ceremony",
        "reception",
        "welcome",
        "rehearsal",
        "brunch",
        "cultural",
        "other",
      ],
      event_visibility: ["public", "private"],
      rsvp_status: ["pending", "accepted", "declined", "tentative"],
      travel_kind: [
        "hotel",
        "airport",
        "parking",
        "transport",
        "attraction",
        "restaurant",
      ],
      wedding_role: ["owner", "planner", "viewer"],
    },
  },
} as const

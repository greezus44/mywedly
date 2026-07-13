import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export interface UserEvent {
  id: string; creator_id: string; name: string; event_type: string;
  event_date: string | null; event_time: string | null; venue: string | null; address: string | null;
  cover_image: string | null; cover_config: CoverConfig | null; login_config: LoginConfig | null;
  theme: ThemeConfig | null; content: EventContent | null; sharing_config: SharingConfig | null;
  draft_name: string | null; draft_event_type: string | null; draft_event_date: string | null; draft_event_time: string | null;
  draft_venue: string | null; draft_address: string | null; draft_cover_image: string | null;
  draft_cover_config: CoverConfig | null; draft_login_config: LoginConfig | null; draft_theme: ThemeConfig | null;
  draft_content: EventContent | null; draft_sharing_config: SharingConfig | null;
  is_published: boolean; is_archived: boolean; published_at: string | null; created_at: string; updated_at: string;
  template_id: string; slug: string | null; draft_slug: string | null; rsvp_deadline: string | null; draft_rsvp_deadline: string | null;
}
export interface SubEvent { id: string; parent_eventId: string; name: string; date: string | null; time: string | null; venue: string | null; address: string | null; description: string | null; dress_code: string | null; rsvp_deadline: string | null; rsvp_enabled: boolean; order_index: number; created_at: string; updated_at: string; }
export interface CoverConfig { bgImage?: string; bgColor?: string; overlayColor?: string; overlayOpacity?: number; textColor?: string; buttonColor?: string; buttonText?: string; font?: string; scriptFont?: string; customText?: string; showDate?: boolean; showCountdown?: boolean; logo?: string; logoWidth?: number; }
export interface LoginConfig { bgImage?: string; bgColor?: string; overlayColor?: string; overlayOpacity?: number; textColor?: string; buttonColor?: string; buttonText?: string; heading?: string; subheading?: string; inputPlaceholder?: string; logo?: string; logoWidth?: number; }
export interface ThemeConfig { preset?: string; primaryColor?: string; secondaryColor?: string; accentColor?: string; bgColor?: string; surfaceColor?: string; textColor?: string; textMutedColor?: string; borderColor?: string; headingFont?: string; bodyFont?: string; scriptFont?: string; buttonRadius?: number; shadowStyle?: string; }
export interface EventContent { rich_title?: string; rich_subtitle?: string; rich_body?: string; story?: string; story_image?: string; invitation_title?: string; invitation_subtitle?: string; invitation_body?: string; invitation_text?: string; rsvp_button_text?: string; sections?: ContentSection[]; }
export interface ContentSection { id: string; title: string; body: string; image?: string; visible: boolean; order_index: number; }
export interface SharingConfig { showShareButtons?: boolean; shareMessage?: string; }
export interface EventGuest { id: string; event_id: string; name: string; email: string; phone: string; group_name: string; side: string; token: string; rsvp_status: "pending" | "attending" | "declined"; rsvp_submitted_at: string | null; plus_ones: number; dietary: string; message: string; created_at: string; table_number: string | null; }
export interface EventRsvp { id: string; event_id: string; sub_event_id: string | null; guest_id: string | null; guest_name: string; status: "attending" | "declined" | "pending"; plus_ones: number; dietary: string; message: string; answers: Record<string, unknown> | null; submitted_at: string; }
export interface ScheduleItem { id: string; event_id: string; sub_event_id: string | null; title: string; description: string | null; schedule_date: string | null; start_time: string | null; end_time: string | null; venue: string | null; address: string | null; dress_code: string | null; category: string | null; cover_image: string | null; order_index: number; created_at: string; }
export interface EventMessage { id: string; event_id: string; guest_name: string; message: string; created_at: string; }
export interface GuestGroup { id: string; event_id: string | null; wedding_id: string; name: string; sort_order: number; created_at: string; updated_at: string; }
export interface GuestGroupMember { guest_id: string; group_id: string; created_at: string; }
export interface GuestEventInvite { guest_id: string; event_id: string; sub_event_id: string | null; invite_type: string; created_at: string; }
export interface GroupEventInvite { group_id: string; event_id: string; sub_event_id: string | null; created_at: string; }
export const EVENT_TYPES = ["Wedding", "Birthday", "Corporate", "Anniversary", "Graduation", "Baby Shower", "Other"] as const;
export const EVENT_TEMPLATES = [{ id: "default", name: "Classic", description: "A clean, modern event template" }, { id: "rusty", name: "Rusty's Template", description: "Luxury wedding with cream & gold aesthetic" }] as const;

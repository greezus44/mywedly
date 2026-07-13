import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type EventKind = "ceremony" | "reception" | "welcome" | "rehearsal" | "brunch" | "cultural" | "other";
export type EventVisibility = "public" | "private";
export type RsvpStatus = "pending" | "accepted" | "declined" | "tentative";

export interface Wedding {
  id: string; slug: string; couple_name_one: string; couple_name_two: string;
  full_name_one?: string; full_name_two?: string;
  wedding_date: string | null; location: string | null; hero_image_url: string | null;
  story: string | null; hashtag: string | null;
  theme: Record<string, unknown>;
  theme_config: ThemeConfig | Record<string, never>;
  draft_theme_config: ThemeConfig | null;
  cover_config: CoverConfig | Record<string, never>;
  draft_cover_config: CoverConfig | Record<string, never> | null;
  sharing_config: SharingConfig | Record<string, never>;
  qr_token: string | null;
  is_published: boolean; created_by: string; created_at: string; updated_at: string;
  content: WeddingContent | Record<string, never>;
  draft_content: WeddingContent | Record<string, never> | null;
  signin_helper: string | null; rsvp_deadline: string | null;
  contact_phone: string | null; cover_monogram_url: string | null;
}

export interface ThemeConfig {
  colors?: { primary?: string; primaryLight?: string; primaryDark?: string; background?: string; backgroundLight?: string; surface?: string; text?: string; textMuted?: string; border?: string; accent?: string; success?: string; warning?: string; error?: string; };
  typography?: { scriptFont?: string; headingFont?: string; bodyFont?: string; uiFont?: string; scriptSize?: string; headingSize?: string; bodySize?: string; letterSpacing?: string; };
  ui?: { radius?: string; buttonRadius?: string; buttonStyle?: string; };
}

export interface CoverConfig {
  branding?: {
    logoUrl?: string | null;
    logoSize?: string;
    logoPosition?: "left" | "center" | "right";
    logoVisible?: boolean;
    divider?: "none" | "line" | "floral" | "ornate";
  };
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    overlayColor?: string;
    overlayOpacity?: number;
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    headingSize?: string;
    bodySize?: string;
    headingWeight?: string;
    bodyWeight?: string;
    letterSpacing?: string;
  };
  layout?: {
    contentAlignment?: "left" | "center" | "right";
    verticalPosition?: "top" | "center" | "bottom";
    buttonStyle?: "outline" | "solid" | "underline";
    borderRadius?: string;
    spacing?: string;
  };
  background?: {
    type?: "image" | "video" | "slideshow" | "color";
    imageUrl?: string | null;
    videoUrl?: string | null;
    slideshowUrls?: string[];
    blur?: number;
    brightness?: number;
    overlayGradient?: string;
  };
}

export interface SharingConfig {
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string | null;
  customDomain?: string | null;
  invitationMessage?: string;
  enableGuestQr?: boolean;
  qrBypassLogin?: boolean;
}

export interface WeddingContent {
  cover_heading?: string; cover_welcome?: string; cover_subtitle?: string;
  cover_background_url?: string; cover_background_type?: "image" | "video";
  cover_logo_url?: string; cover_button_text?: string;
  home_title?: string; home_subtitle?: string; home_body?: string; home_image_url?: string; home_closing_text?: string;
  invitation_intro?: string; invitation_quran_verse?: string; invitation_quran_translation?: string; invitation_quran_reference?: string; invitation_closing?: string;
  doa_title?: string; doa_body?: string; doa_image_url?: string;
  contact_phone?: string; contact_email?: string; contact_address?: string;
  message_intro?: string; rsvp_intro?: string; rsvp_closing?: string;
  countdown_enabled?: boolean; countdown_label?: string;
  [key: string]: unknown;
}

export interface Guest { id: string; wedding_id: string; full_name: string; email: string | null; phone: string | null; group_label: string | null; tag: string | null; plus_one_allowed: boolean; address: string | null; notes: string | null; invite_code: string; group_id: string | null; username: string; first_name: string | null; last_name: string | null; rsvp_status: string; dietary_requirements: string | null; created_at: string; }
export interface GuestGroup { id: string; wedding_id: string; name: string; sort_order: number; created_at: string; updated_at: string; }
export interface WeddingEvent { id: string; wedding_id: string; name: string; kind: EventKind; starts_at: string | null; venue_name: string | null; venue_address: string | null; dress_code: string | null; notes: string | null; visibility: EventVisibility; sort_order: number; created_at: string; description: string | null; maps_url: string | null; image_url: string | null; rsvp_deadline: string | null; capacity: number | null; programme: string | null; }
export interface Rsvp { id: string; wedding_id: string; guest_id: string; guest_name: string | null; guest_email: string | null; status: RsvpStatus; meal_choice: string | null; dietary_restrictions: string | null; song_request: string | null; plus_one_name: string | null; message: string | null; created_at: string; updated_at: string; event_id: string | null; }
export interface GuestEventInvite { guest_id: string; event_id: string; created_at: string; invite_type: string | null; }
export interface GroupEventInvite { group_id: string; event_id: string; created_at: string; }
export interface GuestbookEntry { id: string; wedding_id: string; author_name: string; message: string; is_approved: boolean; created_at: string; }
export interface GuestSession { guest: Guest; wedding: Wedding; }

export interface GuestToken { id: string; guest_id: string; wedding_id: string; token: string; qr_code_url: string | null; bypass_login: boolean; created_at: string; updated_at: string; }
export interface SharingEvent { id: string; wedding_id: string; event_type: string; guest_id: string | null; source: string | null; device_type: string | null; metadata: Record<string, unknown>; created_at: string; }
export interface SavedTheme { id: string; wedding_id: string; name: string; theme_config: ThemeConfig; cover_config: CoverConfig; created_at: string; updated_at: string; }

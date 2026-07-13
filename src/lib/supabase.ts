import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export interface ThemeConfig {
  primary: string; secondary: string; accent: string; bg: string; surface: string;
  text: string; textMuted: string; border: string; buttonBg: string; buttonText: string;
  scriptFont: string; headingFont: string; bodyFont: string; uiFont: string;
  headingSize: string; bodySize: string; headingWeight: string; bodyWeight: string; letterSpacing: string;
}

export interface LogoConfig {
  url: string | null; visible: boolean; width: string; height: string; maintainAspectRatio: boolean;
  position: "top-left" | "top-center" | "top-right" | "center" | "bottom-left" | "bottom-center" | "bottom-right";
  offsetX: string; offsetY: string; margin: string; padding: string;
  responsive: { desktop: { width: string; height: string }; tablet: { width: string; height: string }; mobile: { width: string; height: string } };
  opacity: number; borderRadius: string;
  dropShadow: { enabled: boolean; blur: string; color: string; offsetX: string; offsetY: string };
  glow: { enabled: boolean; color: string; blur: string };
  rotation: number; maxWidth: string; maxHeight: string; objectFit: "contain" | "cover" | "fill";
  showOnPages: "cover-only" | "all-pages" | "custom"; customPages: string[]; showInNavbar: boolean;
}

export interface CoverConfig {
  background: { type: "image" | "video" | "slideshow" | "color"; image_url: string | null; video_url: string | null; slideshow_urls: string[]; color: string };
  overlay: { enabled: boolean; color: string; opacity: number };
  blur: string; brightness: number;
  branding: { couple_name_one: string; couple_name_two: string; date: string; logo: LogoConfig };
  typography: { heading_font: string; body_font: string; heading_size: string; body_size: string; heading_color: string; body_color: string; heading_weight: string; letter_spacing: string };
  layout: { content_alignment: "left" | "center" | "right"; vertical_position: "top" | "center" | "bottom"; max_width: string; padding: string };
  button: { text: string; bg_color: string; text_color: string; border_radius: string; padding_x: string; padding_y: string };
  corner_radius: string; show_countdown: boolean; show_date: boolean; enter_button_text: string;
}

export interface LoginConfig {
  branding: { logo: LogoConfig };
  text: { title: string; subtitle: string; welcome_message: string; username_placeholder: string; button_text: string; helper_text: string; footer_message: string };
  language: { enabled: boolean; default_lang: "en" | "ms"; labels: { en: string; ms: string }; order: ("en" | "ms")[] };
  background: { type: "image" | "video" | "color"; image_url: string | null; video_url: string | null; color: string };
  overlay: { enabled: boolean; color: string; opacity: number };
  blur: string; brightness: number;
  theme: { primary: string; secondary: string; accent: string; text: string; button_bg: string; button_text: string; input_bg: string; border: string };
  typography: { heading_font: string; body_font: string; heading_size: string; body_size: string; heading_weight: string; body_weight: string; letter_spacing: string };
  form: {
    input: { width: string; height: string; border_radius: string; border_color: string; background: string; placeholder_color: string; focus_border_color: string; shadow: string; text_color: string; font_size: string; padding: string };
    button: { width: string; height: string; border_radius: string; bg_color: string; text_color: string; hover_bg_color: string; shadow: string; font_size: string; font_weight: string; loading_text: string };
    username_field: { show_label: boolean; label_text: string };
  };
  layout: { content_alignment: "left" | "center" | "right"; vertical_position: "top" | "center" | "bottom"; max_width: string; spacing: string; padding: string; margin: string };
  language_selector: { style: "segmented" | "dropdown"; button_radius: string; button_padding_x: string; button_padding_y: string; active_bg: string; active_text: string; inactive_bg: string; inactive_text: string; border_color: string; font_size: string; font_weight: string };
}

export interface WeddingContent {
  home_title?: string; home_subtitle?: string; home_body?: string; home_image_url?: string; home_closing_text?: string;
  quran_verse?: string; quran_translation?: string; quran_reference?: string;
  doa_title?: string; doa_body?: string; doa_image_url?: string;
  contact_phone?: string; contact_email?: string; contact_address?: string;
  message_intro?: string; rsvp_intro?: string; rsvp_closing?: string;
}

export interface SharingConfig { enabled: boolean; share_url: string | null; og_title: string; og_description: string; og_image_url: string | null; twitter_card: string; allow_qr_bypass: boolean }

export type EventKind = "akad" | "resepsi" | "majlis" | "other";
export type EventVisibility = "public" | "private";
export type RsvpStatus = "attending" | "declined" | "pending";
export type GuestbookStatus = "pending" | "approved" | "rejected";

export interface Wedding {
  id: string; slug: string; couple_name_one: string; couple_name_two: string; wedding_date: string | null; location: string | null;
  hero_image_url: string | null; story: string | null; hashtag: string | null; theme: ThemeConfig; is_published: boolean;
  created_by: string; created_at: string; updated_at: string;
  content: WeddingContent | null; draft_content: WeddingContent | null;
  theme_config: ThemeConfig | null; draft_theme_config: ThemeConfig | null;
  cover_config: CoverConfig | null; draft_cover_config: CoverConfig | null;
  login_config: LoginConfig | null; draft_login_config: LoginConfig | null;
  sharing_config: SharingConfig | null; qr_token: string | null; signin_helper: string | null; rsvp_deadline: string | null;
}

export interface WeddingEvent {
  id: string; wedding_id: string; name: string; kind: EventKind; starts_at: string | null;
  venue_name: string | null; venue_address: string | null; dress_code: string | null; notes: string | null;
  visibility: EventVisibility; sort_order: number; created_at: string;
  description: string | null; maps_url: string | null; image_url: string | null; rsvp_deadline: string | null; capacity: number | null; programme: string | null;
}

export interface Guest { id: string; wedding_id: string; name: string; username: string; email: string | null; phone: string | null; group_id: string | null; created_at: string }
export interface Rsvp { id: string; wedding_id: string; guest_id: string; event_id: string; status: RsvpStatus; number_of_guests: number; message: string | null; created_at: string; updated_at: string }
export interface GuestbookEntry { id: string; wedding_id: string; guest_id: string | null; author_name: string; message: string; status: GuestbookStatus; created_at: string }
export interface GuestToken { id: string; wedding_id: string; guest_id: string | null; token: string; expires_at: string | null; created_at: string }
export interface SharingEvent { id: string; wedding_id: string; event_type: "visit" | "qr_scan" | "link_click" | "rsvp"; device_type: string | null; created_at: string }
export interface SavedTheme { id: string; wedding_id: string; name: string; config: ThemeConfig; created_at: string }

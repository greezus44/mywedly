import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type EventKind = "ceremony" | "reception" | "welcome" | "rehearsal" | "brunch" | "cultural" | "other";
export type EventVisibility = "public" | "private";
export type RsvpStatus = "pending" | "accepted" | "declined" | "tentative";

export interface Wedding {
  id: string;
  slug: string;
  couple_name_one: string;
  couple_name_two: string;
  full_name_one?: string;
  full_name_two?: string;
  wedding_date: string | null;
  location: string | null;
  hero_image_url: string | null;
  story: string | null;
  hashtag: string | null;
  theme: Record<string, unknown>;
  theme_config: ThemeConfig | Record<string, never>;
  draft_theme_config: ThemeConfig | null;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  content: WeddingContent | Record<string, never>;
  draft_content: WeddingContent | Record<string, never> | null;
  signin_helper: string | null;
  rsvp_deadline: string | null;
  contact_phone: string | null;
  cover_monogram_url: string | null;
}

export interface ThemeConfig {
  colors?: {
    primary?: string;
    primaryLight?: string;
    primaryDark?: string;
    background?: string;
    backgroundLight?: string;
    surface?: string;
    text?: string;
    textMuted?: string;
    border?: string;
    accent?: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  typography?: {
    scriptFont?: string;
    headingFont?: string;
    bodyFont?: string;
    uiFont?: string;
    scriptSize?: string;
    headingSize?: string;
    bodySize?: string;
    letterSpacing?: string;
  };
  ui?: {
    radius?: string;
    buttonRadius?: string;
    buttonStyle?: string;
  };
}

export interface WeddingContent {
  cover_heading?: string;
  cover_welcome?: string;
  cover_subtitle?: string;
  cover_background_url?: string;
  cover_background_type?: "image" | "video";
  cover_logo_url?: string;
  cover_button_text?: string;
  home_title?: string;
  home_subtitle?: string;
  home_body?: string;
  home_image_url?: string;
  home_closing_text?: string;
  invitation_intro?: string;
  invitation_quran_verse?: string;
  invitation_quran_translation?: string;
  invitation_quran_reference?: string;
  invitation_closing?: string;
  doa_title?: string;
  doa_body?: string;
  doa_image_url?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  message_intro?: string;
  rsvp_intro?: string;
  rsvp_closing?: string;
  countdown_enabled?: boolean;
  countdown_label?: string;
  [key: string]: unknown;
}

export interface Guest {
  id: string;
  wedding_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  group_label: string | null;
  tag: string | null;
  plus_one_allowed: boolean;
  address: string | null;
  notes: string | null;
  invite_code: string;
  group_id: string | null;
  username: string;
  first_name: string | null;
  last_name: string | null;
  rsvp_status: string;
  dietary_requirements: string | null;
  created_at: string;
}

export interface GuestGroup {
  id: string;
  wedding_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingEvent {
  id: string;
  wedding_id: string;
  name: string;
  kind: EventKind;
  starts_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  dress_code: string | null;
  notes: string | null;
  visibility: EventVisibility;
  sort_order: number;
  created_at: string;
  description: string | null;
  maps_url: string | null;
  image_url: string | null;
  rsvp_deadline: string | null;
  capacity: number | null;
  programme: string | null;
}

export interface Rsvp {
  id: string;
  wedding_id: string;
  guest_id: string;
  guest_name: string | null;
  guest_email: string | null;
  status: RsvpStatus;
  meal_choice: string | null;
  dietary_restrictions: string | null;
  song_request: string | null;
  plus_one_name: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
  event_id: string | null;
}

export interface GuestEventInvite {
  guest_id: string;
  event_id: string;
  created_at: string;
  invite_type: string | null;
}

export interface GroupEventInvite {
  group_id: string;
  event_id: string;
  created_at: string;
}

export interface WebsiteContent {
  id: string;
  wedding_id: string;
  section: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  draft_title: string | null;
  draft_body: string | null;
  draft_image_url: string | null;
  draft_is_published: boolean;
}

export interface Gallery {
  id: string;
  wedding_id: string;
  title: string | null;
  sort_order: number;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  wedding_id: string;
  image_url: string;
  caption: string | null;
  uploader_name: string | null;
  is_featured: boolean;
  is_approved: boolean;
  created_at: string;
  gallery_id: string | null;
}

export interface TravelItem {
  id: string;
  wedding_id: string;
  kind: string;
  title: string;
  description: string | null;
  url: string | null;
  address: string | null;
  sort_order: number;
  created_at: string;
}

export interface RegistryItem {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  price_cents: number | null;
  is_cash_fund: boolean;
  sort_order: number;
  created_at: string;
}

export interface GuestbookEntry {
  id: string;
  wedding_id: string;
  author_name: string;
  message: string;
  is_approved: boolean;
  created_at: string;
}

export interface CustomPage {
  id: string;
  wedding_id: string;
  slug: string;
  title: string;
  body: string;
  cover_image_url: string | null;
  inline_image_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuestSession {
  guest: Guest;
  wedding: Wedding;
}

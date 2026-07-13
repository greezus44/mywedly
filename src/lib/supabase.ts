import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type Wedding = {
  id: string; slug: string; couple_name_one: string; couple_name_two: string;
  wedding_date: string | null; location: string | null; hero_image_url: string | null;
  story: string | null; hashtag: string | null; theme: Record<string, unknown>;
  theme_config: Record<string, unknown> | null;
  draft_theme_config: Record<string, unknown> | null;
  is_published: boolean; created_by: string; created_at: string; updated_at: string;
  content: Record<string, unknown>;
  draft_content: Record<string, unknown> | null;
  signin_helper: Record<string, unknown> | string | null;
};

export type Guest = {
  id: string; wedding_id: string; full_name: string; first_name: string | null;
  last_name: string | null; email: string | null; phone: string | null;
  group_label: string | null; tag: string | null; plus_one_allowed: boolean;
  address: string | null; notes: string | null; invite_code: string | null;
  username: string | null; rsvp_status: string | null; dietary_requirements: string | null;
  group_id: string | null; created_at: string;
};

export type GuestGroup = {
  id: string; wedding_id: string; name: string; sort_order: number;
  created_at: string; updated_at: string;
};

export type WeddingEvent = {
  id: string; wedding_id: string; name: string; kind: string;
  starts_at: string; venue_name: string | null; venue_address: string | null;
  dress_code: string | null; notes: string | null; visibility: string;
  sort_order: number; created_at: string;
  description: string | null; maps_url: string | null; image_url: string | null;
  rsvp_deadline: string | null; capacity: number | null;
};

export type Rsvp = {
  id: string; wedding_id: string; guest_id: string | null; guest_name: string;
  guest_email: string | null; status: string; meal_choice: string | null;
  dietary_restrictions: string | null; song_request: string | null;
  plus_one_name: string | null; message: string | null; event_id: string | null;
  created_at: string; updated_at: string;
};

export type WebsiteContent = {
  id: string; wedding_id: string; section: string; title: string | null;
  body: string | null; image_url: string | null; sort_order: number;
  is_published: boolean; created_at: string; updated_at: string;
  draft_title: string | null; draft_body: string | null;
  draft_image_url: string | null; draft_is_published: boolean | null;
};

export type Gallery = {
  id: string; wedding_id: string; title: string; sort_order: number; created_at: string;
};

export type GalleryItem = {
  id: string; wedding_id: string; image_url: string; caption: string | null;
  uploader_name: string | null; is_featured: boolean; is_approved: boolean;
  created_at: string; gallery_id: string | null;
};

export type TravelItem = {
  id: string; wedding_id: string; kind: string; title: string;
  description: string | null; url: string | null; address: string | null;
  sort_order: number; created_at: string;
};

export type RegistryItem = {
  id: string; wedding_id: string; title: string; description: string | null;
  url: string | null; image_url: string | null; price_cents: number | null;
  is_cash_fund: boolean; sort_order: number; created_at: string;
};

export type GuestSession = {
  guestId: string; weddingId: string; fullName: string; weddingSlug: string;
};

export type CoverContent = {
  cover_heading?: string;
  cover_subtitle?: string;
  cover_welcome?: string;
  cover_button_text?: string;
  cover_background_url?: string;
  cover_background_video_url?: string;
  cover_logo_url?: string;
  cover_logo_position?: "left" | "center" | "right";
  cover_logo_size?: string;
  cover_logo_visible?: boolean;
  cover_overlay_opacity?: number;
  cover_text_align?: "left" | "center" | "right";
  cover_countdown_enabled?: boolean;
  cover_music_enabled?: boolean;
  cover_music_url?: string;
  cover_main_heading?: string;
  [key: string]: unknown;
};

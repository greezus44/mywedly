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
  is_published: boolean; created_by: string; created_at: string; updated_at: string;
  content: Record<string, unknown>; signin_helper: Record<string, unknown> | string | null;
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

export type GuestGroupMember = {
  guest_id: string; group_id: string; created_at: string;
};

export type EventKind = "ceremony" | "reception" | "welcome" | "rehearsal" | "brunch" | "cultural" | "other";
export type EventVisibility = "public" | "private";

export type WeddingEvent = {
  id: string; wedding_id: string; name: string; kind: EventKind;
  starts_at: string; venue_name: string | null; venue_address: string | null;
  dress_code: string | null; notes: string | null; visibility: EventVisibility;
  sort_order: number; created_at: string;
  description: string | null; maps_url: string | null; image_url: string | null;
  rsvp_deadline: string | null; capacity: number | null;
};

export type GroupEventInvite = {
  group_id: string; event_id: string; created_at: string;
};

export type GuestEventInvite = {
  guest_id: string; event_id: string; created_at: string;
  invite_type: "include" | "exclude";
};

export type RsvpStatus = "pending" | "accepted" | "declined" | "tentative";

export type Rsvp = {
  id: string; wedding_id: string; guest_id: string | null; guest_name: string;
  guest_email: string | null; status: RsvpStatus; meal_choice: string | null;
  dietary_restrictions: string | null; song_request: string | null;
  plus_one_name: string | null; message: string | null; event_id: string | null;
  created_at: string; updated_at: string;
};

export type WebsiteContent = {
  id: string; wedding_id: string; section: string; title: string | null;
  body: string | null; image_url: string | null; sort_order: number;
  is_published: boolean; created_at: string; updated_at: string;
};

export type Gallery = {
  id: string; wedding_id: string; title: string; sort_order: number;
  created_at: string;
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

export type CustomPage = {
  id: string; wedding_id: string; slug: string; title: string; body: string | null;
  cover_image_url: string | null; inline_image_url: string | null;
  sort_order: number; is_published: boolean; created_at: string; updated_at: string;
};

export type GuestSession = {
  guestId: string;
  weddingId: string;
  fullName: string;
  weddingSlug: string;
};

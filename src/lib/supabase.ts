import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type Wedding = {
  id: string;
  slug: string;
  couple_name_one: string;
  couple_name_two: string;
  wedding_date: string | null;
  location: string | null;
  hero_image_url: string | null;
  story: string | null;
  hashtag: string | null;
  theme: Record<string, unknown>;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  content: Record<string, unknown>;
  signin_helper: Record<string, unknown>;
};

export type TextStyle = {
  fontFamily?: string;
  size?: string;
  color?: string;
  weight?: string;
  letterSpacing?: string;
  lineHeight?: string;
  textTransform?: string;
  align?: string;
  italic?: boolean;
  bold?: boolean;
};

export type WeddingContent = {
  cover_heading?: string;
  cover_subtitle?: string;
  cover_welcome?: string;
  cover_background_url?: string;
  cover_logo_url?: string;
  invitation_text?: string;
  closing_text?: string;
  parents?: string;
  info_heading?: string;
  info_body?: string;
  info_image_url?: string;
  text_styles?: Record<string, TextStyle>;
  theme_preset?: string;
  [key: string]: unknown;
};

export type GuestEvent = {
  id: string;
  wedding_id: string;
  name: string;
  kind: string;
  starts_at: string;
  venue_name: string | null;
  venue_address: string | null;
  dress_code: string | null;
  notes: string | null;
  visibility: string;
  sort_order: number;
  created_at: string;
};

export type Guest = {
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
  invite_code: string | null;
  group_id: string | null;
  username: string | null;
  created_at: string;
};

export type Rsvp = {
  id: string;
  wedding_id: string;
  guest_id: string | null;
  guest_name: string;
  guest_email: string | null;
  status: string;
  meal_choice: string | null;
  dietary_restrictions: string | null;
  song_request: string | null;
  plus_one_name: string | null;
  message: string | null;
  event_id: string | null;
  created_at: string;
  updated_at: string;
};

export type GuestGroup = {
  id: string;
  wedding_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CustomPage = {
  id: string;
  wedding_id: string;
  slug: string;
  title: string;
  body: string | null;
  cover_image_url: string | null;
  inline_image_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type GuestSession = {
  guestId: string;
  weddingId: string;
  fullName: string;
};

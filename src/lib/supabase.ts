import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "http://localhost:54321",
  supabaseAnonKey ?? "public-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/** Generic JSON type matching Supabase's jsonb columns. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserEvent {
  id: string;
  creator_id: string;
  name: string;
  draft_name: string | null;
  event_type: string | null;
  draft_event_type: string | null;
  event_date: string | null;
  draft_event_date: string | null;
  event_time: string | null;
  draft_event_time: string | null;
  venue: string | null;
  draft_venue: string | null;
  address: string | null;
  draft_address: string | null;
  cover_image: string | null;
  draft_cover_image: string | null;
  cover_config: Json;
  draft_cover_config: Json | null;
  theme: Json;
  draft_theme: Json | null;
  logo_config: Json;
  draft_logo_config: Json | null;
  content: Json;
  draft_content: Json | null;
  login_config: Json;
  draft_login_config: Json | null;
  sharing_config: Json;
  draft_sharing_config: Json | null;
  is_published: boolean;
  is_archived: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
  draft_slug: string | null;
  rsvp_deadline: string | null;
  draft_rsvp_deadline: string | null;
}

export interface SubEvent {
  id: string;
  parent_event_id: string;
  name: string;
  date: string | null;
  time: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  address: string | null;
  description: string | null;
  dress_code: string | null;
  rsvp_deadline: string | null;
  rsvp_enabled: boolean;
  order_index: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventGuest {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  group_name: string | null;
  side: string | null;
  token: string | null;
  rsvp_status: string | null;
  rsvp_submitted_at: string | null;
  plus_ones: number;
  dietary: string | null;
  message: string | null;
  table_number: string | null;
  username: string | null;
  group_id: string | null;
  created_at: string;
}

export interface GuestGroup {
  id: string;
  event_id: string | null;
  wedding_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GuestGroupMember {
  guest_id: string;
  group_id: string;
  created_at: string;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  guest_id: string | null;
  guest_name: string | null;
  status: string | null;
  plus_ones: number;
  plus_one_names: string[];
  dietary: string | null;
  message: string | null;
  answers: Json | null;
  submitted_at: string | null;
  responded_at: string | null;
  sub_event_id: string | null;
}

export interface EventSchedule {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  schedule_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  address: string | null;
  dress_code: string | null;
  category: string | null;
  cover_image: string | null;
  order_index: number;
  sub_event_id: string | null;
  created_at: string;
}

export interface EventMessage {
  id: string;
  event_id: string;
  guest_name: string | null;
  message: string | null;
  created_at: string;
}

export interface CustomPage {
  id: string;
  event_id: string | null;
  wedding_id: string | null;
  slug: string;
  title: string;
  body: string;
  cover_image_url: string | null;
  inline_image_url: string | null;
  sort_order: number;
  is_published: boolean;
  nav_label: string | null;
  icon: string | null;
  show_in_nav: boolean;
  blocks: Json | null;
  is_footer: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface SubEventGroupAssignment {
  id: string;
  sub_event_id: string;
  group_id: string;
  created_at: string;
}

export interface GuestInvitationOverride {
  id: string;
  sub_event_id: string;
  guest_id: string;
  is_invited: boolean;
  created_at: string;
}

export interface SharingEvent {
  id: string;
  wedding_id: string | null;
  event_type: string | null;
  guest_id: string | null;
  source: string | null;
  device_type: string | null;
  metadata: Json | null;
  created_at: string;
}

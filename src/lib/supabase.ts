import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

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
  event_type: string;
  event_date: string | null;
  event_time: string | null;
  venue: string;
  address: string;
  cover_image: string | null;
  cover_config: Json;
  login_config: Json;
  theme: Json;
  logo_config: Json;
  content: Json;
  sharing_config: Json;
  draft_name: string | null;
  draft_event_type: string | null;
  draft_event_date: string | null;
  draft_event_time: string | null;
  draft_venue: string | null;
  draft_address: string | null;
  draft_cover_image: string | null;
  draft_cover_config: Json | null;
  draft_login_config: Json | null;
  draft_theme: Json | null;
  draft_logo_config: Json | null;
  draft_content: Json | null;
  draft_sharing_config: Json | null;
  is_published: boolean;
  is_archived: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  template_id: string;
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
  venue: string;
  address: string;
  description: string | null;
  dress_code: string | null;
  rsvp_deadline: string | null;
  rsvp_enabled: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  start_time: string | null;
  end_time: string | null;
  display_order: number;
  wedding_id: string | null;
}

export interface EventGuest {
  id: string;
  event_id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string;
  group_name: string;
  side: string;
  group_id: string | null;
  token: string;
  rsvp_status: string;
  rsvp_submitted_at: string | null;
  plus_ones: number;
  dietary: string;
  message: string;
  created_at: string;
  table_number: string | null;
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
  guest_name: string;
  status: string;
  plus_ones: number;
  dietary: string;
  message: string;
  answers: Json;
  submitted_at: string;
  sub_event_id: string | null;
}

export interface EventSchedule {
  id: string;
  event_id: string;
  title: string;
  description: string;
  schedule_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  dress_code: string;
  category: string;
  cover_image: string;
  order_index: number;
  created_at: string;
  sub_event_id: string | null;
}

export interface EventMessage {
  id: string;
  event_id: string;
  guest_name: string;
  message: string;
  created_at: string;
}

export interface CustomPage {
  id: string;
  wedding_id: string;
  event_id: string | null;
  slug: string;
  title: string;
  body: string;
  cover_image_url: string | null;
  inline_image_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  nav_label: string;
  icon: string | null;
  show_in_nav: boolean;
  blocks: Json;
  is_footer: boolean;
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
  wedding_id: string;
  event_type: string;
  guest_id: string | null;
  source: string | null;
  device_type: string | null;
  metadata: Json;
  created_at: string;
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserEvent {
  id: string;
  owner_id: string;
  slug: string;
  draft_slug: string | null;
  title: string;
  description: string | null;
  event_date: string | null;
  event_end_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_map_url: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  draft_title: string | null;
  draft_description: string | null;
  draft_event_date: string | null;
  draft_event_end_date: string | null;
  draft_venue_name: string | null;
  draft_venue_address: string | null;
  draft_venue_map_url: string | null;
  draft_published_at: string | null;
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
  cover_image: string | null;
  draft_cover_image: string | null;
  is_published: boolean;
  is_archived: boolean;
  rsvp_deadline: string | null;
  draft_rsvp_deadline: string | null;
}

export interface SubEvent {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventGuest {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  guest_count: number | null;
  plus_one_allowed: boolean | null;
  dietary_notes: string | null;
  rsvp_status: string | null;
  rsvp_count: number | null;
  rsvp_sub_events: Json;
  rsvp_responded_at: string | null;
  custom_fields: Json;
  created_at: string;
  updated_at: string;
}

export interface GuestGroup {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestGroupMember {
  id: string;
  group_id: string;
  guest_id: string;
  created_at: string;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  guest_id: string;
  guest_name: string | null;
  status: string;
  plus_ones: number | null;
  guest_count: number | null;
  dietary: string | null;
  dietary_notes: string | null;
  message: string | null;
  answers: Json;
  submitted_at: string;
  responded_at: string | null;
  sub_event_id: string | null;
}

export interface EventSchedule {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventMessage {
  id: string;
  event_id: string;
  guest_name: string | null;
  message: string;
  created_at: string;
}

export interface CustomPage {
  id: string;
  wedding_id: string | null;
  event_id: string;
  title: string;
  slug: string;
  body: string | null;
  cover_image_url: string | null;
  inline_image_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  nav_label: string | null;
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
  guest_id: string;
  sub_event_id: string | null;
  allowed: boolean;
  created_at: string;
}

export interface SharingEvent {
  id: string;
  event_id: string;
  platform: string;
  url: string;
  created_at: string;
}

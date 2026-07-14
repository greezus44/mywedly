import { createClient } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  template_id: string | null;
}

export interface SubEvent {
  id: string;
  parent_event_id: string;
  name: string;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  address: string | null;
  description: string | null;
  created_at: string;
}

export interface EventGuest {
  id: string;
  event_id: string;
  full_name: string;
  username: string;
  email: string | null;
  phone: string | null;
  table_number: string | null;
  group_id: string | null;
  is_attending: boolean | null;
  rsvp_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestGroup {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  created_at: string;
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
  sub_event_id: string | null;
  status: string;
  plus_one_count: number;
  plus_one_names: string[];
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventSchedule {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  created_at: string;
}

export interface EventMessage {
  id: string;
  event_id: string;
  guest_id: string | null;
  message: string;
  created_at: string;
}

export interface CustomPage {
  id: string;
  event_id: string;
  title: string;
  slug: string;
  content: Json;
  blocks: Json;
  cover_image: string | null;
  is_published: boolean;
  show_in_nav: boolean;
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
  guest_id: string;
  sub_event_id: string;
  is_invited: boolean;
  created_at: string;
}

export interface SharingEvent {
  id: string;
  event_id: string;
  type: string;
  metadata: Json;
  created_at: string;
}

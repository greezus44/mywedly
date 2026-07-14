import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

export interface UserEvent {
  id: string;
  creator_id: string;
  name: string;
  event_type: string;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  address: string | null;
  cover_image: string | null;
  cover_config: Record<string, unknown> | null;
  login_config: Record<string, unknown> | null;
  theme: Record<string, unknown> | null;
  logo_config: Record<string, unknown> | null;
  content: Record<string, unknown> | null;
  sharing_config: Record<string, unknown> | null;
  draft_name: string | null;
  draft_event_type: string | null;
  draft_event_date: string | null;
  draft_event_time: string | null;
  draft_venue: string | null;
  draft_address: string | null;
  draft_cover_image: string | null;
  draft_cover_config: Record<string, unknown> | null;
  draft_login_config: Record<string, unknown> | null;
  draft_theme: Record<string, unknown> | null;
  draft_logo_config: Record<string, unknown> | null;
  draft_content: Record<string, unknown> | null;
  draft_sharing_config: Record<string, unknown> | null;
  is_published: boolean;
  is_archived: boolean;
  published_at: string | null;
  template_id: string;
  slug: string | null;
  draft_slug: string | null;
  rsvp_deadline: string | null;
  draft_rsvp_deadline: string | null;
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
  token: string;
  rsvp_status: string;
  rsvp_submitted_at: string | null;
  plus_ones: number;
  dietary: string | null;
  message: string | null;
  created_at: string;
  table_number: string | null;
  username: string | null;
  group_id: string | null;
}

export interface EventMessage {
  id: string;
  event_id: string;
  guest_name: string;
  message: string;
  created_at: string;
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
  created_at: string;
  sub_event_id: string | null;
}

export interface SubEvent {
  id: string;
  parent_event_id: string;
  name: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  address: string | null;
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

export interface GuestGroup {
  id: string;
  event_id: string | null;
  wedding_id: string | null;
  name: string;
  sort_order: number;
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
  created_at: string | null;
}

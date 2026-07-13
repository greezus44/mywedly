import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) || "http://localhost:54321";
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "corporate", label: "Corporate" },
  { value: "graduation", label: "Graduation" },
  { value: "baby_shower", label: "Baby Shower" },
  { value: "anniversary", label: "Anniversary" },
  { value: "engagement", label: "Engagement" },
  { value: "other", label: "Other" },
] as const;

export const EVENT_TEMPLATES = [
  { id: "default", name: "Classic", event_type: "other" },
  { id: "rusty", name: "Rustic", event_type: "wedding" },
  { id: "elegant", name: "Elegant", event_type: "wedding" },
  { id: "modern", name: "Modern", event_type: "corporate" },
  { id: "playful", name: "Playful", event_type: "birthday" },
] as const;

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
  cover_config: CoverConfig;
  login_config: LoginConfig;
  theme: ThemeConfig;
  logo_config: LogoConfig;
  content: EventContent;
  sharing_config: SharingConfig;
  draft_name: string | null;
  draft_event_type: string | null;
  draft_event_date: string | null;
  draft_event_time: string | null;
  draft_venue: string | null;
  draft_address: string | null;
  draft_cover_image: string | null;
  draft_cover_config: CoverConfig | null;
  draft_login_config: LoginConfig | null;
  draft_theme: ThemeConfig | null;
  draft_logo_config: LogoConfig | null;
  draft_content: EventContent | null;
  draft_sharing_config: SharingConfig | null;
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

export interface CoverConfig {
  title?: string;
  subtitle?: string;
  cover_image?: string | null;
  date?: string | null;
  time?: string | null;
  venue?: string | null;
  logo_image?: string | null;
}

export interface LoginConfig {
  heading?: string;
  subheading?: string;
  background_image?: string | null;
  logo_image?: string | null;
  require_password?: boolean;
  password?: string;
}

export interface ThemeConfig {
  bg?: string;
  surface?: string;
  border?: string;
  text?: string;
  muted?: string;
  primary?: string;
  primaryHover?: string;
  primaryLight?: string;
  accent?: string;
  font?: string;
}

export interface LogoConfig {
  image?: string | null;
  position?: string;
}

export interface EventContent {
  title?: string;
  subtitle?: string;
  body?: string;
}

export interface SharingConfig {
  slug?: string;
  custom_message?: string;
}

export interface SubEvent {
  id: string;
  parent_event_id: string;
  wedding_id?: string | null;
  name: string;
  description?: string | null;
  date: string | null;
  time: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  address: string | null;
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
  email: string;
  phone: string;
  group_name: string;
  side: string;
  token: string;
  rsvp_status: string;
  rsvp_submitted_at: string | null;
  plus_ones: number;
  dietary: string;
  message: string;
  created_at: string;
  table_number: string | null;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  guest_id: string | null;
  guest_name: string;
  attending: boolean;
  plus_ones: number;
  message: string;
  dietary: string;
  submitted_at: string;
}

export interface ScheduleItem {
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
  sub_event_id: string | null;
  created_at: string;
}

export interface EventMessage {
  id: string;
  event_id: string;
  guest_name: string;
  message: string;
  created_at: string;
}

export interface GuestGroup {
  id: string;
  wedding_id: string | null;
  event_id: string | null;
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

export interface GroupEventInvite {
  id: string;
  group_id: string;
  event_id: string;
  sub_event_id: string | null;
  created_at: string;
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ---------------------------------------------------------------------------
// Shared config interfaces
// ---------------------------------------------------------------------------

export interface CoverConfig {
  bgImage?: string | null;
  bgColor?: string | null;
  overlayColor?: string | null;
  overlayOpacity?: number | null;
  textColor?: string | null;
  buttonColor?: string | null;
  buttonText?: string | null;
  font?: string | null;
  scriptFont?: string | null;
  customText?: string | null;
  showDate?: boolean | null;
  showCountdown?: boolean | null;
  logo?: string | null;
  logoWidth?: number | null;
}

export interface LoginConfig {
  bgImage?: string | null;
  bgColor?: string | null;
  overlayColor?: string | null;
  overlayOpacity?: number | null;
  textColor?: string | null;
  buttonColor?: string | null;
  buttonText?: string | null;
  heading?: string | null;
  subheading?: string | null;
  inputPlaceholder?: string | null;
  logo?: string | null;
  logoWidth?: number | null;
}

export interface ThemeConfig {
  preset?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  bgColor?: string | null;
  surfaceColor?: string | null;
  textColor?: string | null;
  textMutedColor?: string | null;
  borderColor?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  scriptFont?: string | null;
  buttonRadius?: number | null;
  shadowStyle?: string | null;
}

export interface ContentSection {
  id: string;
  title: string;
  body: string;
  image?: string | null;
  visible: boolean;
  order_index: number;
}

export interface EventContent {
  rich_title?: string | null;
  rich_subtitle?: string | null;
  rich_body?: string | null;
  story?: string | null;
  story_image?: string | null;
  invitation_title?: string | null;
  invitation_subtitle?: string | null;
  invitation_body?: string | null;
  invitation_text?: string | null;
  rsvp_button_text?: string | null;
  sections?: ContentSection[] | null;
}

export interface SharingConfig {
  showShareButtons?: boolean | null;
  shareMessage?: string | null;
}

// ---------------------------------------------------------------------------
// Domain entities
// ---------------------------------------------------------------------------

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
  cover_config: CoverConfig | null;
  login_config: LoginConfig | null;
  theme: ThemeConfig | null;
  content: EventContent | null;
  sharing_config: SharingConfig | null;

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
  draft_content: EventContent | null;
  draft_sharing_config: SharingConfig | null;

  is_published: boolean;
  is_archived: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  template_id: string | null;
  slug: string | null;
  draft_slug: string | null;
  rsvp_deadline: string | null;
  draft_rsvp_deadline: string | null;
}

export interface SubEvent {
  id: string;
  parent_eventId: string;
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
}

export interface EventGuest {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  group_name: string | null;
  side: string | null;
  token: string;
  rsvp_status: "pending" | "attending" | "declined";
  rsvp_submitted_at: string | null;
  plus_ones: number;
  dietary: string | null;
  message: string | null;
  created_at: string;
  table_number: string | null;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  sub_event_id: string | null;
  guest_id: string | null;
  guest_name: string;
  status: "attending" | "declined" | "pending";
  plus_ones: number;
  dietary: string | null;
  message: string | null;
  answers: Record<string, unknown> | null;
  submitted_at: string;
}

export interface ScheduleItem {
  id: string;
  event_id: string;
  sub_event_id: string | null;
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
  event_id: string | null;
  wedding_id: string;
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

export interface GuestEventInvite {
  guest_id: string;
  event_id: string;
  sub_event_id: string | null;
  invite_type: string;
  created_at: string;
}

export interface GroupEventInvite {
  group_id: string;
  event_id: string;
  sub_event_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Corporate",
  "Anniversary",
  "Graduation",
  "Baby Shower",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "default",
    name: "Classic",
    description: "A clean, modern event template",
  },
  {
    id: "rusty",
    name: "Rusty's Template",
    description: "Luxury wedding with cream & gold aesthetic",
  },
];

// ---------------------------------------------------------------------------
// Table names (handy for queries)
// ---------------------------------------------------------------------------

export const TABLES = {
  EVENTS: "events",
  SUB_EVENTS: "sub_events",
  GUESTS: "event_guests",
  RSVPS: "event_rsvps",
  SCHEDULE: "schedule_items",
  MESSAGES: "event_messages",
  GUEST_GROUPS: "guest_groups",
  GUEST_GROUP_MEMBERS: "guest_group_members",
  GUEST_EVENT_INVITES: "guest_event_invites",
  GROUP_EVENT_INVITES: "group_event_invites",
} as const;

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env vars. Check .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type EventType =
  | "wedding" | "engagement" | "reception" | "birthday" | "anniversary"
  | "baby_shower" | "graduation" | "corporate" | "conference" | "party" | "other";

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "engagement", label: "Engagement" },
  { value: "reception", label: "Reception" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "baby_shower", label: "Baby Shower" },
  { value: "graduation", label: "Graduation" },
  { value: "corporate", label: "Corporate" },
  { value: "conference", label: "Conference" },
  { value: "party", label: "Party" },
  { value: "other", label: "Other" },
];

export type TemplateId = "default" | "rusty";

export interface EventTemplate {
  id: string;
  name: string;
  type: EventType;
  description: string;
  template_id: TemplateId;
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  { id: "wedding-classic", name: "Classic Wedding", type: "wedding", description: "Elegant and timeless", template_id: "default" },
  { id: "wedding-modern", name: "Modern Wedding", type: "wedding", description: "Clean and contemporary", template_id: "default" },
  { id: "birthday-fun", name: "Fun Birthday", type: "birthday", description: "Playful and bright", template_id: "default" },
  { id: "corporate-formal", name: "Formal Corporate", type: "corporate", description: "Professional and polished", template_id: "default" },
  { id: "minimal", name: "Minimal", type: "other", description: "Clean slate, fully custom", template_id: "default" },
  { id: "luxury", name: "Luxury", type: "other", description: "Premium and sophisticated", template_id: "default" },
  { id: "rusty", name: "Rusty's Template", type: "wedding", description: "Luxury wedding invitation with gold accents", template_id: "rusty" },
];

export interface UserEvent {
  id: string;
  creator_id: string;
  name: string;
  event_type: EventType;
  template_id: TemplateId;
  slug: string | null;
  draft_slug: string | null;
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
  rsvp_deadline: string | null;
  draft_rsvp_deadline: string | null;
  draft_cover_config: CoverConfig;
  draft_login_config: LoginConfig;
  draft_theme: ThemeConfig;
  draft_logo_config: LogoConfig;
  draft_content: EventContent;
  draft_sharing_config: SharingConfig;
  draft_event_date: string | null;
  draft_event_time: string | null;
  draft_venue: string | null;
  draft_address: string | null;
  draft_cover_image: string | null;
  is_published: boolean;
  is_archived: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoverConfig {
  bgImage: string;
  bgColor: string;
  overlayColor: string;
  overlayOpacity: number;
  textColor: string;
  buttonColor: string;
  buttonText: string;
  font: string;
  scriptFont: string;
  customText: string;
  showDate: boolean;
  showCountdown: boolean;
}

export interface LoginConfig {
  title: string;
  subtitle: string;
  welcomeMessage: string;
  inputPlaceholder: string;
  buttonText: string;
  bgColor: string;
  cardBgColor: string;
  textColor: string;
  inputBgColor: string;
  buttonColor: string;
  borderColor: string;
  headingFont: string;
  headingFontSize: number;
  headingWeight: string;
  font: string;
  bgImage: string;
  overlayOpacity: number;
  showLogo: boolean;
}

export interface ThemeConfig {
  preset: string;
  bgColor: string;
  primaryColor: string;
  accentColor: string;
  headingColor: string;
  bodyColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  headingFont: string;
  bodyFont: string;
  scriptFont: string;
  buttonRadius: number;
  sectionPadding: number;
  maxWidth: number;
  applyToAll: boolean;
}

export interface LogoConfig {
  enabled: boolean;
  image: string;
  text: string;
  fontSize: number;
  color: string;
}

export interface InfoSection {
  id: string;
  title: string;
  body: string;
  image: string;
  visible: boolean;
  order_index: number;
}

export interface EventContent {
  story: string;
  story_image: string;
  gallery: string[];
  sections: InfoSection[];
  invitation_title: string;
  invitation_subtitle: string;
  invitation_body: string;
  invitation_text: string;
  rsvp_button_text: string;
}

export interface SharingConfig {
  showShareButtons: boolean;
  shareMessage: string;
  whatsappText: string;
  facebookText: string;
  emailSubject: string;
  emailBody: string;
  qrColor: string;
  qrBgColor: string;
}

export interface EventGuest {
  id: string;
  event_id: string;
  name: string;
  table_number: string | null;
  plus_ones: number | null;
  group_name: string | null;
  token: string | null;
  rsvp_status: "pending" | "attending" | "declined" | null;
  rsvp_submitted_at: string | null;
  dietary: string | null;
  message: string | null;
  created_at: string;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  guest_id: string | null;
  guest_name: string;
  status: "attending" | "declined" | "maybe";
  plus_ones: number;
  dietary: string | null;
  message: string | null;
  answers: Record<string, unknown> | null;
  submitted_at: string;
}

export interface ScheduleItem {
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
}

export interface EventMessage {
  id: string;
  event_id: string;
  guest_name: string;
  message: string;
  created_at: string;
}

export interface SlugRedirect {
  id: string;
  slug: string;
  event_id: string;
  created_at: string;
}

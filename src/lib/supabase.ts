import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export interface Wedding {
  id: string;
  creator_id: string;
  title: string;
  groom_name: string;
  bride_name: string;
  groom_parents: string;
  bride_parents: string;
  wedding_date: string | null;
  wedding_time: string | null;
  venue: string;
  address: string;
  map_lat: number | null;
  map_lng: number | null;
  cover_image: string | null;
  cover_config: CoverConfig;
  login_config: LoginConfig;
  theme: ThemeConfig;
  logo_config: LogoConfig;
  content: WeddingContent;
  sharing_config: SharingConfig;
  draft_title: string | null;
  draft_groom_name: string | null;
  draft_bride_name: string | null;
  draft_groom_parents: string | null;
  draft_bride_parents: string | null;
  draft_wedding_date: string | null;
  draft_wedding_time: string | null;
  draft_venue: string | null;
  draft_address: string | null;
  draft_cover_image: string | null;
  draft_cover_config: CoverConfig | null;
  draft_login_config: LoginConfig | null;
  draft_theme: ThemeConfig | null;
  draft_logo_config: LogoConfig | null;
  draft_content: WeddingContent | null;
  draft_sharing_config: SharingConfig | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThemeConfig {
  bgColor: string;
  textColor: string;
  primaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  scriptFont: string;
  headingColor: string;
  bodyColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  buttonRadius: number;
  sectionPadding: number;
  maxWidth: number;
  preset: string;
}

export interface CoverConfig {
  bgColor: string;
  textColor: string;
  overlayColor: string;
  overlayOpacity: number;
  bgImage: string;
  font: string;
  scriptFont: string;
  showDate: boolean;
  showCountdown: boolean;
  customText: string;
  buttonText: string;
  buttonColor: string;
}

export interface LoginConfig {
  bgColor: string;
  cardBgColor: string;
  textColor: string;
  accentColor: string;
  font: string;
  headingFont: string;
  title: string;
  subtitle: string;
  welcomeMessage: string;
  buttonText: string;
  inputPlaceholder: string;
  showLogo: boolean;
  logoSize: number;
  bgImage: string;
  overlayOpacity: number;
  inputBgColor: string;
  buttonColor: string;
  borderColor: string;
  headingFontSize: number;
  bodyFontSize: number;
  headingWeight: string;
  bodyWeight: string;
}

export interface LogoConfig {
  enabled: boolean;
  text: string;
  image: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
}

export interface WeddingContent {
  story: string;
  story_image: string;
  gallery: string[];
  gallery_titles: string[];
  extra_pages: ExtraPage[];
  rsvp_title: string;
  rsvp_description: string;
  rsvp_fields: string[];
  rsvp_questions: RsvpQuestion[];
  doa_title: string;
  doa_description: string;
  doa_enabled: boolean;
  message_enabled: boolean;
  contact_enabled: boolean;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  navigation: NavItem[];
  footer_text: string;
  footer_enabled: boolean;
}

export interface ExtraPage {
  id: string;
  title: string;
  content: string;
  slug: string;
}

export interface NavItem {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
}

export interface RsvpQuestion {
  id: string;
  text: string;
  type: "text" | "radio" | "checkbox" | "select";
  options: string[];
  required: boolean;
}

export interface SharingConfig {
  enabled: boolean;
  message: string;
  whatsappText: string;
  facebookText: string;
  instagramText: string;
  emailSubject: string;
  emailBody: string;
  customUrl: string;
  qrColor: string;
  qrBgColor: string;
}

export interface WeddingEvent {
  id: string;
  wedding_id: string;
  title: string;
  description: string;
  event_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  venue: string;
  address: string;
  dress_code: string;
  category: string;
  cover_image: string;
  order_index: number;
  created_at: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  email: string;
  phone: string;
  group_name: string;
  side: string;
  token: string;
  rsvp_status: "pending" | "attending" | "not_attending" | "maybe";
  rsvp_submitted_at: string | null;
  plus_ones: number;
  actual_attendance: number;
  dietary: string;
  message: string;
  created_at: string;
}

export interface Rsvp {
  id: string;
  wedding_id: string;
  guest_id: string;
  guest_name: string;
  status: "attending" | "not_attending" | "maybe";
  plus_ones: number;
  dietary: string;
  message: string;
  answers: Record<string, string>;
  submitted_at: string;
}

export interface GuestbookEntry {
  id: string;
  wedding_id: string;
  guest_name: string;
  message: string;
  created_at: string;
}

export interface GuestToken {
  token: string;
  guest_id: string;
  wedding_id: string;
  guest_name: string;
  expires_at: string;
}

export interface SharingEvent {
  id: string;
  wedding_id: string;
  platform: string;
  guest_id: string;
  guest_name: string;
  created_at: string;
}

export interface SavedTheme {
  id: string;
  wedding_id: string;
  name: string;
  config: ThemeConfig;
  created_at: string;
}

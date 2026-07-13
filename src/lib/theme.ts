import { ThemeConfig, CoverConfig, LoginConfig, LogoConfig, EventContent, SharingConfig } from "./supabase";

export const DEFAULT_THEME: ThemeConfig = {
  preset: "minimal",
  bgColor: "#ffffff",
  primaryColor: "#000000",
  accentColor: "#666666",
  headingColor: "#000000",
  bodyColor: "#333333",
  buttonBgColor: "#000000",
  buttonTextColor: "#ffffff",
  headingFont: "Inter",
  bodyFont: "Inter",
  scriptFont: "Inter",
  buttonRadius: 10,
  sectionPadding: 80,
  maxWidth: 900,
  applyToAll: false,
};

export const RUSTY_THEME: ThemeConfig = {
  preset: "rusty",
  bgColor: "#F5ECD7",
  primaryColor: "#B8962E",
  accentColor: "#C4A44A",
  headingColor: "#A07820",
  bodyColor: "#8B7355",
  buttonBgColor: "#B8962E",
  buttonTextColor: "#FFFFFF",
  headingFont: '"Cormorant Garamond"',
  bodyFont: "Inter",
  scriptFont: '"Cormorant Garamond"',
  buttonRadius: 12,
  sectionPadding: 64,
  maxWidth: 480,
  applyToAll: true,
};

export const RUSTY_COVER_CONFIG: CoverConfig = {
  bgImage: "",
  bgColor: "#F5ECD7",
  overlayColor: "#000000",
  overlayOpacity: 0,
  textColor: "#A07820",
  buttonColor: "#B8962E",
  buttonText: "Enter",
  font: '"Cormorant Garamond"',
  scriptFont: '"Cormorant Garamond"',
  customText: "The Wedding Of",
  showDate: false,
  showCountdown: false,
};

export const RUSTY_LOGIN_CONFIG: LoginConfig = {
  title: "Welcome",
  subtitle: "Please enter your name to continue",
  welcomeMessage: "We're delighted to have you join us",
  inputPlaceholder: "Enter your full name",
  buttonText: "Continue",
  bgColor: "#F5ECD7",
  cardBgColor: "#FAF3E0",
  textColor: "#A07820",
  inputBgColor: "#FFFFFF",
  buttonColor: "#B8962E",
  borderColor: "#C4A44A",
  headingFont: '"Cormorant Garamond"',
  headingFontSize: 28,
  headingWeight: "500",
  font: "Inter",
  bgImage: "",
  overlayOpacity: 0,
  showLogo: false,
};

export const RUSTY_CONTENT: EventContent = {
  story: "",
  story_image: "",
  gallery: [],
  sections: [],
  invitation_title: "Our Wedding",
  invitation_subtitle: "We invite you to celebrate with us",
  invitation_body: "Together with our families, we joyfully invite you to share in our celebration of love.",
  invitation_text: "Your presence would be an honour",
  rsvp_button_text: "RSVP Now",
};

export const DEFAULT_COVER_CONFIG: CoverConfig = {
  bgImage: "",
  bgColor: "#000000",
  overlayColor: "#000000",
  overlayOpacity: 0.4,
  textColor: "#ffffff",
  buttonColor: "#ffffff",
  buttonText: "Enter Event",
  font: "Inter",
  scriptFont: "Inter",
  customText: "",
  showDate: true,
  showCountdown: true,
};

export const DEFAULT_LOGIN_CONFIG: LoginConfig = {
  title: "Welcome",
  subtitle: "Please enter your name to continue",
  welcomeMessage: "We're glad you're here",
  inputPlaceholder: "Your full name",
  buttonText: "Sign In",
  bgColor: "#ffffff",
  cardBgColor: "#ffffff",
  textColor: "#000000",
  inputBgColor: "#f5f5f5",
  buttonColor: "#000000",
  borderColor: "#eaeaea",
  headingFont: "Inter",
  headingFontSize: 28,
  headingWeight: "700",
  font: "Inter",
  bgImage: "",
  overlayOpacity: 0.3,
  showLogo: true,
};

export const DEFAULT_LOGO_CONFIG: LogoConfig = {
  enabled: false,
  image: "",
  text: "E",
  fontSize: 32,
  color: "#000000",
};

export const DEFAULT_CONTENT: EventContent = {
  story: "We invite you to join us for a special celebration.",
  story_image: "",
  gallery: [],
  sections: [],
  invitation_title: "",
  invitation_subtitle: "",
  invitation_body: "",
  invitation_text: "",
  rsvp_button_text: "RSVP",
};

export const DEFAULT_SHARING_CONFIG: SharingConfig = {
  showShareButtons: true,
  shareMessage: "You're invited! Join us for our special event.",
  whatsappText: "You're invited! Join us for our special event.",
  facebookText: "You're invited! Join us for our special event.",
  emailSubject: "You're invited!",
  emailBody: "Join us for our special event.",
  qrColor: "#000000",
  qrBgColor: "#ffffff",
};

export const THEME_PRESETS: { id: string; name: string; config: Partial<ThemeConfig> }[] = [
  { id: "minimal", name: "Minimal", config: { bgColor: "#ffffff", primaryColor: "#000000", accentColor: "#666666", headingColor: "#000000", bodyColor: "#333333", buttonBgColor: "#000000", buttonTextColor: "#ffffff" } },
  { id: "midnight", name: "Midnight", config: { bgColor: "#0a0a0a", primaryColor: "#ffffff", accentColor: "#999999", headingColor: "#ffffff", bodyColor: "#cccccc", buttonBgColor: "#ffffff", buttonTextColor: "#000000" } },
  { id: "rusty", name: "Rusty", config: { bgColor: "#F5ECD7", primaryColor: "#B8962E", accentColor: "#C4A44A", headingColor: "#A07820", bodyColor: "#8B7355", buttonBgColor: "#B8962E", buttonTextColor: "#FFFFFF", headingFont: '"Cormorant Garamond"', scriptFont: '"Cormorant Garamond"' } },
  { id: "sage", name: "Sage", config: { bgColor: "#f4f6f2", primaryColor: "#3a4d3a", accentColor: "#6b8e6b", headingColor: "#2a3a2a", bodyColor: "#4a5a4a", buttonBgColor: "#3a4d3a", buttonTextColor: "#ffffff" } },
  { id: "rose", name: "Rose", config: { bgColor: "#fdf5f5", primaryColor: "#8b3a3a", accentColor: "#b06060", headingColor: "#6b2a2a", bodyColor: "#5a4a4a", buttonBgColor: "#8b3a3a", buttonTextColor: "#ffffff" } },
  { id: "navy", name: "Navy", config: { bgColor: "#f0f3f8", primaryColor: "#1a2a4a", accentColor: "#4a6a9a", headingColor: "#1a2a4a", bodyColor: "#3a4a5a", buttonBgColor: "#1a2a4a", buttonTextColor: "#ffffff" } },
  { id: "stone", name: "Stone", config: { bgColor: "#f5f5f0", primaryColor: "#4a4a4a", accentColor: "#8a8a8a", headingColor: "#3a3a3a", bodyColor: "#5a5a5a", buttonBgColor: "#4a4a4a", buttonTextColor: "#ffffff" } },
];

export const FONT_OPTIONS = ["Inter", "Georgia", "Cormorant Garamond", "Times New Roman", "Helvetica", "Arial", "Courier New", "Verdana"];

export const FONT_WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra Bold" },
];

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--bg-color": theme.bgColor,
    "--primary-color": theme.primaryColor,
    "--accent-color": theme.accentColor,
    "--heading-color": theme.headingColor,
    "--body-color": theme.bodyColor,
    "--button-bg": theme.buttonBgColor,
    "--button-text": theme.buttonTextColor,
    "--heading-font": theme.headingFont,
    "--body-font": theme.bodyFont,
    "--script-font": theme.scriptFont,
    "--button-radius": `${theme.buttonRadius}px`,
    "--section-padding": `${theme.sectionPadding}px`,
    "--max-width": `${theme.maxWidth}px`,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

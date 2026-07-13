import type { ThemeConfig, CoverConfig, LoginConfig, LogoConfig, EventContent, SharingConfig } from "./supabase";

export const DEFAULT_THEME: ThemeConfig = {
  bgColor: "#faf8f5", textColor: "#2a2a2a", primaryColor: "#b8a589", accentColor: "#8b7355",
  headingFont: "Playfair Display", bodyFont: "Montserrat", scriptFont: "Great Vibes",
  headingColor: "#2a2a2a", bodyColor: "#4a4a4a", buttonBgColor: "#b8a589", buttonTextColor: "#ffffff",
  buttonRadius: 4, sectionPadding: 64, maxWidth: 800, preset: "classic",
};

export const DEFAULT_LOGO_CONFIG: LogoConfig = {
  enabled: false, text: "E", image: "", fontSize: 28, color: "#b8a589", fontFamily: "Great Vibes", fontWeight: "400",
};

export const DEFAULT_COVER_CONFIG: CoverConfig = {
  bgColor: "#1a1a1a", textColor: "#ffffff", overlayColor: "#000000", overlayOpacity: 0.4,
  bgImage: "", font: "Playfair Display", scriptFont: "Great Vibes",
  showDate: true, showCountdown: true, customText: "", buttonText: "Open Invitation", buttonColor: "#b8a589",
};

export const DEFAULT_LOGIN_CONFIG: LoginConfig = {
  bgColor: "#faf8f5", cardBgColor: "#ffffff", textColor: "#2a2a2a", accentColor: "#b8a589",
  font: "Montserrat", headingFont: "Playfair Display",
  title: "Enter Invitation", subtitle: "Please enter your name to continue",
  welcomeMessage: "Welcome to our event", buttonText: "Continue", inputPlaceholder: "Your full name",
  showLogo: true, logoSize: 32, bgImage: "", overlayOpacity: 0.3,
  inputBgColor: "#ffffff", buttonColor: "#b8a589", borderColor: "#e5e7eb",
  headingFontSize: 28, bodyFontSize: 14, headingWeight: "600", bodyWeight: "400",
};

export const DEFAULT_CONTENT: EventContent = {
  story: "", story_image: "", gallery: [], gallery_titles: [], extra_pages: [],
  rsvp_title: "RSVP", rsvp_description: "Please let us know if you can make it",
  rsvp_fields: [], rsvp_questions: [],
  doa_title: "Wishes", doa_description: "Share your wishes for the event",
  doa_enabled: true, message_enabled: true, contact_enabled: true,
  contact_phone: "", contact_email: "", contact_address: "",
  navigation: [], footer_text: "Made with love", footer_enabled: true,
};

export const DEFAULT_SHARING_CONFIG: SharingConfig = {
  enabled: true, message: "You're invited!", whatsappText: "You're invited! Click here to view the invitation",
  facebookText: "We're having an event! View the invitation", instagramText: "We're having an event! Link in bio",
  emailSubject: "You're invited", emailBody: "We would be delighted to have you. Please view our invitation",
  customUrl: "", qrColor: "#000000", qrBgColor: "#ffffff",
};

export const THEME_PRESETS: { id: string; name: string; config: Partial<ThemeConfig> }[] = [
  { id: "classic", name: "Classic", config: { bgColor: "#faf8f5", primaryColor: "#b8a589", accentColor: "#8b7355", headingColor: "#2a2a2a", bodyColor: "#4a4a4a", buttonBgColor: "#b8a589", buttonTextColor: "#ffffff" } },
  { id: "blush", name: "Blush", config: { bgColor: "#fff5f5", primaryColor: "#e8b4b8", accentColor: "#d49a9e", headingColor: "#4a2c2e", bodyColor: "#6b4c4e", buttonBgColor: "#e8b4b8", buttonTextColor: "#ffffff" } },
  { id: "sage", name: "Sage", config: { bgColor: "#f5f7f0", primaryColor: "#9caf88", accentColor: "#7a8b6a", headingColor: "#2a3a1a", bodyColor: "#4a5a3a", buttonBgColor: "#9caf88", buttonTextColor: "#ffffff" } },
  { id: "navy", name: "Navy", config: { bgColor: "#f0f2f5", primaryColor: "#2c3e50", accentColor: "#1a2a3a", headingColor: "#1a2a3a", bodyColor: "#3a4a5a", buttonBgColor: "#2c3e50", buttonTextColor: "#ffffff" } },
  { id: "burgundy", name: "Burgundy", config: { bgColor: "#faf5f5", primaryColor: "#800020", accentColor: "#5a0018", headingColor: "#3a0010", bodyColor: "#5a1020", buttonBgColor: "#800020", buttonTextColor: "#ffffff" } },
  { id: "rose-gold", name: "Rose Gold", config: { bgColor: "#fdf6f0", primaryColor: "#b76e79", accentColor: "#9a5c66", headingColor: "#4a2c30", bodyColor: "#6a4c50", buttonBgColor: "#b76e79", buttonTextColor: "#ffffff" } },
  { id: "emerald", name: "Emerald", config: { bgColor: "#f0f7f0", primaryColor: "#2d6a4f", accentColor: "#1b4332", headingColor: "#1b4332", bodyColor: "#2d4a3a", buttonBgColor: "#2d6a4f", buttonTextColor: "#ffffff" } },
  { id: "ivory", name: "Ivory", config: { bgColor: "#fffff0", primaryColor: "#d4c4a8", accentColor: "#b8a888", headingColor: "#3a3a2a", bodyColor: "#5a5a4a", buttonBgColor: "#d4c4a8", buttonTextColor: "#3a3a2a" } },
  { id: "terracotta", name: "Terracotta", config: { bgColor: "#faf0e6", primaryColor: "#c47a4a", accentColor: "#a05a2a", headingColor: "#3a2a1a", bodyColor: "#5a4a3a", buttonBgColor: "#c47a4a", buttonTextColor: "#ffffff" } },
  { id: "charcoal", name: "Charcoal", config: { bgColor: "#f5f5f5", primaryColor: "#333333", accentColor: "#1a1a1a", headingColor: "#1a1a1a", bodyColor: "#3a3a3a", buttonBgColor: "#333333", buttonTextColor: "#ffffff" } },
];

export const FONT_OPTIONS = [
  "Playfair Display", "Cormorant Garamond", "Cormorant", "EB Garamond", "Cinzel",
  "Marcellus", "Great Vibes", "Dancing Script", "Tangerine", "Sacramento",
  "Parisienne", "Montserrat", "Lato", "Inter", "Rozha One", "Spectral",
  "Libre Baskerville", "Source Serif Pro", "Bodoni Moda",
];

export const FONT_WEIGHTS = [
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Bold", value: "700" },
];

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--wed-bg": theme.bgColor, "--wed-text": theme.textColor, "--wed-primary": theme.primaryColor,
    "--wed-accent": theme.accentColor, "--wed-heading-font": `"${theme.headingFont}", serif`,
    "--wed-body-font": `"${theme.bodyFont}", sans-serif`, "--wed-script-font": `"${theme.scriptFont}", cursive`,
    "--wed-heading-color": theme.headingColor, "--wed-body-color": theme.bodyColor,
    "--wed-button-bg": theme.buttonBgColor, "--wed-button-text": theme.buttonTextColor,
    "--wed-button-radius": `${theme.buttonRadius}px`, "--wed-section-padding": `${theme.sectionPadding}px`,
    "--wed-max-width": `${theme.maxWidth}px`,
  };
}

export function coverToCssVars(cover: CoverConfig): Record<string, string> {
  return {
    "--wed-cover-bg": cover.bgColor, "--wed-cover-text": cover.textColor,
    "--wed-cover-overlay": String(cover.overlayOpacity),
    "--wed-cover-image": cover.bgImage ? `url(${cover.bgImage})` : "none",
    "--wed-cover-font": `"${cover.font}", serif`, "--wed-cover-script-font": `"${cover.scriptFont}", cursive`,
  };
}

export function loginToCssVars(login: LoginConfig): Record<string, string> {
  return {
    "--wed-login-bg": login.bgColor, "--wed-login-card-bg": login.cardBgColor,
    "--wed-login-text": login.textColor, "--wed-login-accent": login.accentColor,
    "--wed-login-font": `"${login.font}", sans-serif`, "--wed-login-heading-font": `"${login.headingFont}", serif`,
  };
}

export function getLogoStyle(logo: LogoConfig): React.CSSProperties {
  if (logo.image) return {};
  return { fontSize: `${logo.fontSize}px`, color: logo.color, fontFamily: `"${logo.fontFamily}", cursive`, fontWeight: logo.fontWeight };
}

export function shouldShowLogo(logo: LogoConfig): boolean {
  return logo.enabled && (!!logo.text || !!logo.image);
}

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
  { id: "sage", name: "Sage", config: { bgColor: "#f4f6f2", primaryColor: "#3a4d3a", accentColor: "#6b8e6b", headingColor: "#2a3a2a", bodyColor: "#4a5a4a", buttonBgColor: "#3a4d3a", buttonTextColor: "#ffffff" } },
  { id: "rose", name: "Rose", config: { bgColor: "#fdf5f5", primaryColor: "#8b3a3a", accentColor: "#b06060", headingColor: "#6b2a2a", bodyColor: "#5a4a4a", buttonBgColor: "#8b3a3a", buttonTextColor: "#ffffff" } },
  { id: "navy", name: "Navy", config: { bgColor: "#f0f3f8", primaryColor: "#1a2a4a", accentColor: "#4a6a9a", headingColor: "#1a2a4a", bodyColor: "#3a4a5a", buttonBgColor: "#1a2a4a", buttonTextColor: "#ffffff" } },
  { id: "warm", name: "Warm", config: { bgColor: "#faf7f2", primaryColor: "#5a4a2a", accentColor: "#9a8a5a", headingColor: "#4a3a1a", bodyColor: "#5a5a4a", buttonBgColor: "#5a4a2a", buttonTextColor: "#ffffff" } },
  { id: "ocean", name: "Ocean", config: { bgColor: "#f0f7fa", primaryColor: "#1a4a6a", accentColor: "#4a8aaa", headingColor: "#1a4a6a", bodyColor: "#3a5a6a", buttonBgColor: "#1a4a6a", buttonTextColor: "#ffffff" } },
  { id: "forest", name: "Forest", config: { bgColor: "#f2f8f4", primaryColor: "#2a5a3a", accentColor: "#5a8a6a", headingColor: "#2a5a3a", bodyColor: "#3a5a4a", buttonBgColor: "#2a5a3a", buttonTextColor: "#ffffff" } },
  { id: "stone", name: "Stone", config: { bgColor: "#f5f5f0", primaryColor: "#4a4a4a", accentColor: "#8a8a8a", headingColor: "#3a3a3a", bodyColor: "#5a5a5a", buttonBgColor: "#4a4a4a", buttonTextColor: "#ffffff" } },
  { id: "blush", name: "Blush", config: { bgColor: "#fdf8f8", primaryColor: "#a0506a", accentColor: "#c08090", headingColor: "#80405a", bodyColor: "#5a4a4a", buttonBgColor: "#a0506a", buttonTextColor: "#ffffff" } },
];

export const FONT_OPTIONS = [
  "Inter",
  "Georgia",
  "Times New Roman",
  "Helvetica",
  "Arial",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
];

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

import type { ThemeConfig } from "./supabase";

export const DEFAULT_THEME: ThemeConfig = {
  preset: "classic",
  primaryColor: "#111827",
  secondaryColor: "#6b7280",
  accentColor: "#d4af37",
  bgColor: "#ffffff",
  surfaceColor: "#ffffff",
  textColor: "#111827",
  textMutedColor: "#6b7280",
  borderColor: "#e5e7eb",
  headingFont: "Cormorant Garamond",
  bodyFont: "Inter",
  scriptFont: "Dancing Script",
  buttonRadius: 6,
  shadowStyle: "soft",
};

export const RUSTY_THEME: ThemeConfig = {
  preset: "rusty",
  primaryColor: "#8b7355",
  secondaryColor: "#a89072",
  accentColor: "#d4af37",
  bgColor: "#fdfbf7",
  surfaceColor: "#ffffff",
  textColor: "#3d3528",
  textMutedColor: "#8a7a65",
  borderColor: "#e8dfd0",
  headingFont: "Cormorant Garamond",
  bodyFont: "EB Garamond",
  scriptFont: "Great Vibes",
  buttonRadius: 4,
  shadowStyle: "soft",
};

export const RUSTY_COVER_CONFIG = {
  bgImage: null,
  bgColor: "#fdfbf7",
  overlayColor: "#000000",
  overlayOpacity: 0.2,
  textColor: "#3d3528",
  buttonColor: "#8b7355",
  buttonText: "Enter",
  font: "Cormorant Garamond",
  scriptFont: "Great Vibes",
  customText: null,
  showDate: true,
  showCountdown: true,
  logo: null,
  logoWidth: 120,
};

export const RUSTY_LOGIN_CONFIG = {
  bgImage: null,
  bgColor: "#fdfbf7",
  overlayColor: "#000000",
  overlayOpacity: 0.15,
  textColor: "#3d3528",
  buttonColor: "#8b7355",
  buttonText: "Continue",
  heading: "Welcome",
  subheading: "Please enter your name to continue",
  inputPlaceholder: "Your full name",
  logo: null,
  logoWidth: 100,
};

export const RUSTY_CONTENT = {
  rich_title: null,
  rich_subtitle: null,
  rich_body: null,
  story: null,
  story_image: null,
  invitation_title: "You're Invited",
  invitation_subtitle: "We would be honored by your presence",
  invitation_body:
    "Together with our families, we invite you to share in our celebration of love.",
  invitation_text: null,
  rsvp_button_text: "RSVP",
  sections: [],
};

export interface ThemePreset {
  id: string;
  name: string;
  theme: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic",
    name: "Classic",
    theme: {
      preset: "classic",
      primaryColor: "#111827",
      secondaryColor: "#6b7280",
      accentColor: "#d4af37",
      bgColor: "#ffffff",
      surfaceColor: "#ffffff",
      textColor: "#111827",
      textMutedColor: "#6b7280",
      borderColor: "#e5e7eb",
      headingFont: "Cormorant Garamond",
      bodyFont: "Inter",
      scriptFont: "Dancing Script",
      buttonRadius: 6,
      shadowStyle: "soft",
    },
  },
  {
    id: "rusty",
    name: "Rusty",
    theme: {
      preset: "rusty",
      primaryColor: "#8b7355",
      secondaryColor: "#a89072",
      accentColor: "#d4af37",
      bgColor: "#fdfbf7",
      surfaceColor: "#ffffff",
      textColor: "#3d3528",
      textMutedColor: "#8a7a65",
      borderColor: "#e8dfd0",
      headingFont: "Cormorant Garamond",
      bodyFont: "EB Garamond",
      scriptFont: "Great Vibes",
      buttonRadius: 4,
      shadowStyle: "soft",
    },
  },
  {
    id: "mono",
    name: "Mono",
    theme: {
      preset: "mono",
      primaryColor: "#000000",
      secondaryColor: "#525252",
      accentColor: "#a3a3a3",
      bgColor: "#ffffff",
      surfaceColor: "#fafafa",
      textColor: "#000000",
      textMutedColor: "#737373",
      borderColor: "#e5e5e5",
      headingFont: "Montserrat",
      bodyFont: "Inter",
      scriptFont: "Dancing Script",
      buttonRadius: 0,
      shadowStyle: "none",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    theme: {
      preset: "ocean",
      primaryColor: "#1e3a5f",
      secondaryColor: "#3b6e9e",
      accentColor: "#7eb8d9",
      bgColor: "#f0f6fb",
      surfaceColor: "#ffffff",
      textColor: "#1e3a5f",
      textMutedColor: "#5a7a99",
      borderColor: "#cfe0ee",
      headingFont: "Playfair Display",
      bodyFont: "Lora",
      scriptFont: "Dancing Script",
      buttonRadius: 8,
      shadowStyle: "soft",
    },
  },
  {
    id: "forest",
    name: "Forest",
    theme: {
      preset: "forest",
      primaryColor: "#2d4a2b",
      secondaryColor: "#5b7a56",
      accentColor: "#a3c293",
      bgColor: "#f5f7f2",
      surfaceColor: "#ffffff",
      textColor: "#2d4a2b",
      textMutedColor: "#6b7a66",
      borderColor: "#d5e0cf",
      headingFont: "Cormorant Garamond",
      bodyFont: "Lora",
      scriptFont: "Great Vibes",
      buttonRadius: 6,
      shadowStyle: "soft",
    },
  },
  {
    id: "rose",
    name: "Rose",
    theme: {
      preset: "rose",
      primaryColor: "#9d5b6b",
      secondaryColor: "#c08a97",
      accentColor: "#e8c5cf",
      bgColor: "#fdf5f7",
      surfaceColor: "#ffffff",
      textColor: "#6b3a4a",
      textMutedColor: "#9a7a85",
      borderColor: "#f0d9e0",
      headingFont: "Playfair Display",
      bodyFont: "Lora",
      scriptFont: "Dancing Script",
      buttonRadius: 10,
      shadowStyle: "soft",
    },
  },
];

export interface FontOption {
  value: string;
  label: string;
  stack: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { value: "Cormorant Garamond", label: "Cormorant Garamond", stack: '"Cormorant Garamond", serif' },
  { value: "Inter", label: "Inter", stack: '"Inter", sans-serif' },
  { value: "Playfair Display", label: "Playfair Display", stack: '"Playfair Display", serif' },
  { value: "Montserrat", label: "Montserrat", stack: '"Montserrat", sans-serif' },
  { value: "Lora", label: "Lora", stack: '"Lora", serif' },
  { value: "Crimson Text", label: "Crimson Text", stack: '"Crimson Text", serif' },
  { value: "EB Garamond", label: "EB Garamond", stack: '"EB Garamond", serif' },
];

export const RICH_FONT_OPTIONS: FontOption[] = [
  { value: "Cormorant Garamond", label: "Cormorant Garamond", stack: '"Cormorant Garamond", serif' },
  { value: "Inter", label: "Inter", stack: '"Inter", sans-serif' },
  { value: "Playfair Display", label: "Playfair Display", stack: '"Playfair Display", serif' },
  { value: "Montserrat", label: "Montserrat", stack: '"Montserrat", sans-serif' },
  { value: "Lora", label: "Lora", stack: '"Lora", serif' },
  { value: "Crimson Text", label: "Crimson Text", stack: '"Crimson Text", serif' },
  { value: "EB Garamond", label: "EB Garamond", stack: '"EB Garamond", serif' },
  { value: "Dancing Script", label: "Dancing Script", stack: '"Dancing Script", cursive' },
  { value: "Great Vibes", label: "Great Vibes", stack: '"Great Vibes", cursive' },
];

export interface FontSizeOption {
  value: string;
  label: string;
}

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { value: "12px", label: "Small" },
  { value: "14px", label: "Medium" },
  { value: "16px", label: "Normal" },
  { value: "18px", label: "Large" },
  { value: "24px", label: "Heading 3" },
  { value: "32px", label: "Heading 2" },
  { value: "48px", label: "Heading 1" },
];

/**
 * Convert a ThemeConfig to CSS variables for the .event-themed scope
 */
export function themeToEventCssVars(theme: ThemeConfig | null | undefined): Record<string, string> {
  if (!theme) return {};

  const vars: Record<string, string> = {};

  if (theme.primaryColor) vars["--event-primary"] = theme.primaryColor;
  if (theme.secondaryColor) vars["--event-secondary"] = theme.secondaryColor;
  if (theme.accentColor) vars["--event-accent"] = theme.accentColor;
  if (theme.bgColor) vars["--event-bg"] = theme.bgColor;
  if (theme.surfaceColor) vars["--event-surface"] = theme.surfaceColor;
  if (theme.textColor) vars["--event-text"] = theme.textColor;
  if (theme.textMutedColor) vars["--event-muted"] = theme.textMutedColor;
  if (theme.borderColor) vars["--event-border"] = theme.borderColor;
  if (theme.headingFont) vars["--event-heading-font"] = `"${theme.headingFont}", serif`;
  if (theme.bodyFont) vars["--event-body-font"] = `"${theme.bodyFont}", sans-serif`;
  if (theme.scriptFont) vars["--event-script-font"] = `"${theme.scriptFont}", cursive`;
  if (theme.buttonRadius != null) vars["--event-button-radius"] = `${theme.buttonRadius}px`;

  return vars;
}

/**
 * Convert text to a URL-safe slug
 */
export function slugify(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Validate a slug string
 */
export function isValidSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

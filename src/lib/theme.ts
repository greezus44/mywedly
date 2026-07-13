import type { ThemeConfig } from "./supabase";

export const DEFAULT_THEME: ThemeConfig = {
  preset: "classic",
  primaryColor: "#0f172a",
  secondaryColor: "#334155",
  accentColor: "#0ea5e9",
  bgColor: "#ffffff",
  bgSubtleColor: "#f8fafc",
  textColor: "#1e293b",
  textMutedColor: "#64748b",
  borderColor: "#e2e8f0",
  headingFont: "Inter",
  bodyFont: "Inter",
  scriptFont: "Cormorant Garamond",
  buttonRadius: 8,
  sectionPadding: 64,
  maxWidth: 1200,
  applyToAll: false,
};

export const RUSTY_THEME: ThemeConfig = {
  preset: "rusty",
  primaryColor: "#B8962E",
  secondaryColor: "#C4A44A",
  accentColor: "#A07820",
  bgColor: "#F5ECD7",
  bgSubtleColor: "#FAF3E0",
  textColor: "#3D3528",
  textMutedColor: "#8B7355",
  borderColor: "#D4C695",
  headingFont: "Cormorant Garamond",
  bodyFont: "Inter",
  scriptFont: "Cormorant Garamond",
  buttonRadius: 4,
  sectionPadding: 80,
  maxWidth: 800,
  applyToAll: true,
};

export const RUSTY_COVER_CONFIG = {
  bgColor: "#F5ECD7",
  textColor: "#3D3528",
  buttonColor: "#B8962E",
  buttonText: "Enter",
  scriptFont: "Cormorant Garamond",
  customText: "Together with their families",
  showDate: true,
  showCountdown: false,
};

export const RUSTY_LOGIN_CONFIG = {
  bgColor: "#FAF3E0",
  textColor: "#3D3528",
  buttonColor: "#B8962E",
  buttonText: "Continue",
  heading: "Welcome",
  subheading: "Please enter your name to continue",
  inputPlaceholder: "Your full name",
};

export const RUSTY_CONTENT = {
  invitation_title: "You're Invited",
  invitation_subtitle: "We would be honoured by your presence",
  invitation_body: "As we celebrate this sacred union, we invite you to join us for a day filled with love, joy, and cherished moments.",
  rsvp_button_text: "RSVP",
  story: "Our journey began with a simple hello, and through every season, our love has grown deeper and stronger.",
};

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  classic: DEFAULT_THEME,
  rusty: RUSTY_THEME,
  ocean: { ...DEFAULT_THEME, preset: "ocean", primaryColor: "#0c4a6e", secondaryColor: "#075985", accentColor: "#0ea5e9", bgColor: "#f0f9ff", bgSubtleColor: "#e0f2fe" },
  forest: { ...DEFAULT_THEME, preset: "forest", primaryColor: "#14532d", secondaryColor: "#166534", accentColor: "#16a34a", bgColor: "#f0fdf4", bgSubtleColor: "#dcfce7" },
  rose: { ...DEFAULT_THEME, preset: "rose", primaryColor: "#881337", secondaryColor: "#9f1239", accentColor: "#e11d48", bgColor: "#fff1f2", bgSubtleColor: "#ffe4e6" },
};

export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Sans)" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond (Serif)" },
];

export function themeToCssVars(theme: ThemeConfig | null): Record<string, string> {
  const t = theme || DEFAULT_THEME;
  return {
    "--color-primary": t.primaryColor || DEFAULT_THEME.primaryColor!,
    "--color-primary-light": t.secondaryColor || DEFAULT_THEME.secondaryColor!,
    "--color-bg": t.bgColor || DEFAULT_THEME.bgColor!,
    "--color-bg-subtle": t.bgSubtleColor || DEFAULT_THEME.bgSubtleColor!,
    "--color-text": t.textColor || DEFAULT_THEME.textColor!,
    "--color-text-muted": t.textMutedColor || DEFAULT_THEME.textMutedColor!,
    "--color-border": t.borderColor || DEFAULT_THEME.borderColor!,
    "--color-accent": t.accentColor || DEFAULT_THEME.accentColor!,
    "--font-heading": `"${t.headingFont || "Inter"}", sans-serif`,
    "--font-body": `"${t.bodyFont || "Inter"}", sans-serif`,
    "--font-script": `"${t.scriptFont || "Cormorant Garamond"}", serif`,
    "--radius": `${t.buttonRadius ?? 8}px`,
    "--max-width": `${t.maxWidth ?? 1200}px`,
  };
}

export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 50;
}

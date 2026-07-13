import type {
  ThemeConfig,
  CoverConfig,
  LoginConfig,
  EventContent,
} from "./supabase";

// ---------------------------------------------------------------------------
// Default theme
// ---------------------------------------------------------------------------

export const DEFAULT_THEME: ThemeConfig = {
  preset: "classic",
  primaryColor: "#1a1a1a",
  secondaryColor: "#6b7280",
  accentColor: "#b08d57",
  bgColor: "#ffffff",
  surfaceColor: "#ffffff",
  textColor: "#1f2937",
  textMutedColor: "#6b7280",
  borderColor: "#e5e7eb",
  headingFont: '"Cormorant Garamond", serif',
  bodyFont: '"Inter", sans-serif',
  scriptFont: '"Dancing Script", cursive',
  buttonRadius: 6,
  shadowStyle: "soft",
};

// ---------------------------------------------------------------------------
// Rusty theme — luxury cream & gold wedding aesthetic
// ---------------------------------------------------------------------------

export const RUSTY_THEME: ThemeConfig = {
  preset: "rusty",
  primaryColor: "#3d2b1f",
  secondaryColor: "#8a6d3b",
  accentColor: "#c9a961",
  bgColor: "#faf6ef",
  surfaceColor: "#fffdf8",
  textColor: "#3d2b1f",
  textMutedColor: "#8a7a5f",
  borderColor: "#e8dcc8",
  headingFont: '"Playfair Display", serif',
  bodyFont: '"Lora", serif',
  scriptFont: '"Great Vibes", cursive',
  buttonRadius: 2,
  shadowStyle: "soft",
};

export const RUSTY_COVER_CONFIG: CoverConfig = {
  bgImage: null,
  bgColor: "#faf6ef",
  overlayColor: "#3d2b1f",
  overlayOpacity: 0.35,
  textColor: "#fffdf8",
  buttonColor: "#c9a961",
  buttonText: "View Invitation",
  font: '"Playfair Display", serif',
  scriptFont: '"Great Vibes", cursive',
  customText: "Together with their families",
  showDate: true,
  showCountdown: true,
  logo: null,
  logoWidth: 120,
};

export const RUSTY_LOGIN_CONFIG: LoginConfig = {
  bgImage: null,
  bgColor: "#faf6ef",
  overlayColor: "#3d2b1f",
  overlayOpacity: 0.25,
  textColor: "#3d2b1f",
  buttonColor: "#c9a961",
  buttonText: "Enter",
  heading: "Welcome",
  subheading: "Please enter your name to continue",
  inputPlaceholder: "Your full name",
  logo: null,
  logoWidth: 120,
};

export const RUSTY_CONTENT: EventContent = {
  rich_title: "Together with their families",
  rich_subtitle: "request the pleasure of your company",
  rich_body:
    "<p>We invite you to join us as we celebrate our union and begin our journey together as one.</p>",
  story:
    "Our story began with a simple hello and grew into a lifetime of love, laughter, and shared dreams. We are so grateful to have you by our side as we take this next step together.",
  story_image: null,
  invitation_title: "You're Invited",
  invitation_subtitle: "To celebrate our wedding",
  invitation_body:
    "<p>Please join us for an evening of celebration as we exchange our vows and dance the night away.</p>",
  invitation_text: "We would be honored by your presence.",
  rsvp_button_text: "RSVP Now",
  sections: [],
};

// ---------------------------------------------------------------------------
// Theme presets
// ---------------------------------------------------------------------------

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean, modern, timeless",
    theme: DEFAULT_THEME,
  },
  {
    id: "rusty",
    name: "Rusty",
    description: "Luxury cream & gold",
    theme: RUSTY_THEME,
  },
  {
    id: "mono",
    name: "Monochrome",
    description: "Black & white minimalism",
    theme: {
      ...DEFAULT_THEME,
      preset: "mono",
      primaryColor: "#000000",
      secondaryColor: "#525252",
      accentColor: "#000000",
      bgColor: "#ffffff",
      surfaceColor: "#fafafa",
      textColor: "#171717",
      textMutedColor: "#737373",
      borderColor: "#e5e5e5",
      headingFont: '"Montserrat", sans-serif',
      bodyFont: '"Inter", sans-serif',
      scriptFont: '"Cormorant Garamond", serif',
      buttonRadius: 0,
      shadowStyle: "none",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool blues & seafoam",
    theme: {
      ...DEFAULT_THEME,
      preset: "ocean",
      primaryColor: "#0c4a6e",
      secondaryColor: "#0e7490",
      accentColor: "#06b6d4",
      bgColor: "#f0f9ff",
      surfaceColor: "#ffffff",
      textColor: "#0c4a6e",
      textMutedColor: "#0369a1",
      borderColor: "#bae6fd",
      headingFont: '"Playfair Display", serif',
      bodyFont: '"Inter", sans-serif',
      scriptFont: '"Dancing Script", cursive',
      buttonRadius: 8,
      shadowStyle: "soft",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Earthy greens & naturals",
    theme: {
      ...DEFAULT_THEME,
      preset: "forest",
      primaryColor: "#14532d",
      secondaryColor: "#166534",
      accentColor: "#65a30d",
      bgColor: "#f7fee7",
      surfaceColor: "#ffffff",
      textColor: "#14532d",
      textMutedColor: "#3f6212",
      borderColor: "#d9f99d",
      headingFont: '"EB Garamond", serif',
      bodyFont: '"Lora", serif',
      scriptFont: '"Dancing Script", cursive',
      buttonRadius: 4,
      shadowStyle: "soft",
    },
  },
  {
    id: "rose",
    name: "Rose",
    description: "Soft pinks & romance",
    theme: {
      ...DEFAULT_THEME,
      preset: "rose",
      primaryColor: "#9d174d",
      secondaryColor: "#be185d",
      accentColor: "#f472b6",
      bgColor: "#fdf2f8",
      surfaceColor: "#ffffff",
      textColor: "#831843",
      textMutedColor: "#9d174d",
      borderColor: "#fbcfe8",
      headingFont: '"Cormorant Garamond", serif',
      bodyFont: '"Crimson Text", serif',
      scriptFont: '"Great Vibes", cursive',
      buttonRadius: 9999,
      shadowStyle: "soft",
    },
  },
];

// ---------------------------------------------------------------------------
// Font options
// ---------------------------------------------------------------------------

export interface FontOption {
  label: string;
  value: string;
  category: "heading" | "body" | "script";
}

export const FONT_OPTIONS: FontOption[] = [
  { label: "Cormorant Garamond", value: '"Cormorant Garamond", serif', category: "heading" },
  { label: "Inter", value: '"Inter", sans-serif', category: "body" },
  { label: "Dancing Script", value: '"Dancing Script", cursive', category: "script" },
  { label: "Playfair Display", value: '"Playfair Display", serif', category: "heading" },
  { label: "Great Vibes", value: '"Great Vibes", cursive', category: "script" },
  { label: "Montserrat", value: '"Montserrat", sans-serif', category: "body" },
  { label: "Lora", value: '"Lora", serif', category: "body" },
  { label: "Crimson Text", value: '"Crimson Text", serif', category: "body" },
  { label: "EB Garamond", value: '"EB Garamond", serif', category: "heading" },
];

/**
 * Rich font options — the 9 fonts available in the rich text editor.
 */
export const RICH_FONT_OPTIONS: FontOption[] = [
  { label: "Cormorant Garamond", value: '"Cormorant Garamond", serif', category: "heading" },
  { label: "Inter", value: '"Inter", sans-serif', category: "body" },
  { label: "Dancing Script", value: '"Dancing Script", cursive', category: "script" },
  { label: "Playfair Display", value: '"Playfair Display", serif', category: "heading" },
  { label: "Great Vibes", value: '"Great Vibes", cursive', category: "script" },
  { label: "Montserrat", value: '"Montserrat", sans-serif', category: "body" },
  { label: "Lora", value: '"Lora", serif', category: "body" },
  { label: "Crimson Text", value: '"Crimson Text", serif', category: "body" },
  { label: "EB Garamond", value: '"EB Garamond", serif', category: "heading" },
];

export interface FontSizeOption {
  label: string;
  value: string;
}

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { label: "Small", value: "12px" },
  { label: "Normal", value: "16px" },
  { label: "Medium", value: "20px" },
  { label: "Large", value: "28px" },
  { label: "X-Large", value: "36px" },
  { label: "Heading 1", value: "48px" },
  { label: "Heading 2", value: "40px" },
  { label: "Heading 3", value: "32px" },
];

// ---------------------------------------------------------------------------
// Theme → CSS variables
// ---------------------------------------------------------------------------

/**
 * Convert a ThemeConfig into a record of CSS custom properties (--event-*)
 * suitable for use as inline `style` on a `.event-themed` container.
 */
export function themeToEventCssVars(theme: ThemeConfig | null | undefined): Record<string, string> {
  const t = theme ?? DEFAULT_THEME;
  const vars: Record<string, string> = {};

  if (t.primaryColor) vars["--event-primary"] = t.primaryColor;
  if (t.secondaryColor) vars["--event-secondary"] = t.secondaryColor;
  if (t.accentColor) vars["--event-accent"] = t.accentColor;
  if (t.bgColor) vars["--event-bg"] = t.bgColor;
  if (t.surfaceColor) vars["--event-surface"] = t.surfaceColor;
  if (t.textColor) vars["--event-text"] = t.textColor;
  if (t.textMutedColor) vars["--event-muted"] = t.textMutedColor;
  if (t.borderColor) vars["--event-border"] = t.borderColor;
  if (t.headingFont) vars["--event-heading-font"] = t.headingFont;
  if (t.bodyFont) vars["--event-body-font"] = t.bodyFont;
  if (t.scriptFont) vars["--event-script-font"] = t.scriptFont;
  if (t.buttonRadius != null) {
    vars["--event-button-radius"] =
      t.buttonRadius >= 9999 ? "9999px" : `${t.buttonRadius}px`;
  }
  if (t.shadowStyle) {
    vars["--event-shadow"] =
      t.shadowStyle === "none"
        ? "none"
        : t.shadowStyle === "hard"
          ? "0 4px 0 0 rgb(0 0 0 / 0.15)"
          : "0 1px 3px 0 rgb(0 0 0 / 0.1)";
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

/**
 * Convert text into a URL-safe slug.
 */
export function slugify(text: string): string {
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
 * Validate that a slug contains only lowercase letters, numbers, and hyphens.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

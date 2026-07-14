import type { Json } from "./supabase";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  heading: string;
  muted: string;
  primary: string;
  primaryHover: string;
  primaryFg: string;
  accent: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  rich: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  fonts: ThemeFonts;
  radius: string;
  fontScale: number;
}

export interface SimplifiedThemeConfig {
  bg?: string;
  surface?: string;
  surfaceAlt?: string;
  border?: string;
  text?: string;
  heading?: string;
  muted?: string;
  primary?: string;
  primaryHover?: string;
  primaryFg?: string;
  accent?: string;
  headingFont?: string;
  bodyFont?: string;
  richFont?: string;
  radius?: string;
  fontScale?: number;
}

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    bg: "#fffbeb",
    surface: "#ffffff",
    surfaceAlt: "rgba(255,255,255,0.08)",
    border: "#fde68a",
    text: "#78350f",
    heading: "#78350f",
    muted: "#92400e",
    primary: "#b45309",
    primaryHover: "#92400e",
    primaryFg: "#ffffff",
    accent: "#d97706",
  },
  fonts: {
    heading: "Georgia, serif",
    body: "Georgia, serif",
    rich: "Georgia, serif",
  },
  radius: "0.5rem",
  fontScale: 1,
};

export const RUSTY_THEME: ThemeConfig = {
  colors: {
    bg: "#1a0f0a",
    surface: "#2a1810",
    surfaceAlt: "rgba(255,255,255,0.05)",
    border: "#5a3a20",
    text: "#e8d5c4",
    heading: "#f4e4d4",
    muted: "#c4a890",
    primary: "#c4661a",
    primaryHover: "#a85518",
    primaryFg: "#ffffff",
    accent: "#e8853a",
  },
  fonts: {
    heading: "'Cormorant Garamond', serif",
    body: "'EB Garamond', serif",
    rich: "'EB Garamond', serif",
  },
  radius: "0.25rem",
  fontScale: 1.05,
};

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  default: DEFAULT_THEME,
  rusty: RUSTY_THEME,
  blush: {
    colors: {
      bg: "#fdf2f8",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#fbcfe8",
      text: "#831843",
      heading: "#9d174d",
      muted: "#be185d",
      primary: "#db2777",
      primaryHover: "#be185d",
      primaryFg: "#ffffff",
      accent: "#ec4899",
    },
    fonts: {
      heading: "'Playfair Display', serif",
      body: "Montserrat, sans-serif",
      rich: "Lora, serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  sage: {
    colors: {
      bg: "#f4f7f3",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#d1e0cf",
      text: "#3d4f3a",
      heading: "#2d4a2b",
      muted: "#5a7053",
      primary: "#5a8a5e",
      primaryHover: "#4a7a4e",
      primaryFg: "#ffffff",
      accent: "#7ba87f",
    },
    fonts: {
      heading: "'Cormorant Garamond', serif",
      body: "'EB Garamond', serif",
      rich: "Cardo, serif",
    },
    radius: "0.375rem",
    fontScale: 1,
  },
  midnight: {
    colors: {
      bg: "#0c0a1e",
      surface: "#1a1535",
      surfaceAlt: "rgba(255,255,255,0.06)",
      border: "#3d3270",
      text: "#e0d8f0",
      heading: "#f0e8ff",
      muted: "#a898d0",
      primary: "#8b5cf6",
      primaryHover: "#7c3aed",
      primaryFg: "#ffffff",
      accent: "#a78bfa",
    },
    fonts: {
      heading: "'Bodoni Moda', serif",
      body: "Montserrat, sans-serif",
      rich: "Lora, serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  ocean: {
    colors: {
      bg: "#f0f9ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#bae6fd",
      text: "#0c4a6e",
      heading: "#075985",
      muted: "#0369a1",
      primary: "#0284c7",
      primaryHover: "#0369a1",
      primaryFg: "#ffffff",
      accent: "#0ea5e9",
    },
    fonts: {
      heading: "Montserrat, sans-serif",
      body: "Inter, sans-serif",
      rich: "Lora, serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  cream: {
    colors: {
      bg: "#fefcf8",
      surface: "#fffefb",
      surfaceAlt: "rgba(0,0,0,0.02)",
      border: "#e8e0d0",
      text: "#4a4035",
      heading: "#3a3025",
      muted: "#7a6f5a",
      primary: "#a08060",
      primaryHover: "#8a6f50",
      primaryFg: "#ffffff",
      accent: "#c4a880",
    },
    fonts: {
      heading: "'EB Garamond', serif",
      body: "'EB Garamond', serif",
      rich: "Cardo, serif",
    },
    radius: "0.25rem",
    fontScale: 1.05,
  },
  forest: {
    colors: {
      bg: "#f3f6f1",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#c8d8c0",
      text: "#1a3a1a",
      heading: "#0d2d0d",
      muted: "#3a5a3a",
      primary: "#2d6a2d",
      primaryHover: "#1a5a1a",
      primaryFg: "#ffffff",
      accent: "#4a8a4a",
    },
    fonts: {
      heading: "'Cormorant Garamond', serif",
      body: "'EB Garamond', serif",
      rich: "Cardo, serif",
    },
    radius: "0.375rem",
    fontScale: 1,
  },
  lavender: {
    colors: {
      bg: "#faf5ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#e9d5ff",
      text: "#581c87",
      heading: "#6b21a8",
      muted: "#7e22ce",
      primary: "#9333ea",
      primaryHover: "#7e22ce",
      primaryFg: "#ffffff",
      accent: "#a855f7",
    },
    fonts: {
      heading: "'Playfair Display', serif",
      body: "Inter, sans-serif",
      rich: "Lora, serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  terracotta: {
    colors: {
      bg: "#fdf5f0",
      surface: "#fffaf5",
      surfaceAlt: "rgba(0,0,0,0.03)",
      border: "#e7c5b0",
      text: "#7c3a1e",
      heading: "#8a3a1e",
      muted: "#a05a3e",
      primary: "#c2410c",
      primaryHover: "#9a3412",
      primaryFg: "#ffffff",
      accent: "#dc6b2f",
    },
    fonts: {
      heading: "'Bodoni Moda', serif",
      body: "'EB Garamond', serif",
      rich: "Cardo, serif",
    },
    radius: "0.375rem",
    fontScale: 1.05,
  },
};

export const RICH_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "EB Garamond (serif)", value: "'EB Garamond', serif" },
  { label: "Cardo (serif)", value: "Cardo, serif" },
  { label: "Lora (serif)", value: "Lora, serif" },
  { label: "Cormorant Garamond (serif)", value: "'Cormorant Garamond', serif" },
  { label: "Playfair Display (serif)", value: "'Playfair Display', serif" },
  { label: "Bodoni Moda (serif)", value: "'Bodoni Moda', serif" },
  { label: "Inter (sans-serif)", value: "Inter, sans-serif" },
  { label: "Montserrat (sans-serif)", value: "Montserrat, sans-serif" },
  { label: "Caveat (handwritten)", value: "Caveat, cursive" },
  { label: "Dancing Script (handwritten)", value: "'Dancing Script', cursive" },
  { label: "Great Vibes (handwritten)", value: "'Great Vibes', cursive" },
];

export const HEADING_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "EB Garamond (serif)", value: "'EB Garamond', serif" },
  { label: "Cormorant Garamond (serif)", value: "'Cormorant Garamond', serif" },
  { label: "Playfair Display (serif)", value: "'Playfair Display', serif" },
  { label: "Bodoni Moda (serif)", value: "'Bodoni Moda', serif" },
  { label: "Cardo (serif)", value: "Cardo, serif" },
  { label: "Lora (serif)", value: "Lora, serif" },
  { label: "Inter (sans-serif)", value: "Inter, sans-serif" },
  { label: "Montserrat (sans-serif)", value: "Montserrat, sans-serif" },
  { label: "Caveat (handwritten)", value: "Caveat, cursive" },
  { label: "Dancing Script (handwritten)", value: "'Dancing Script', cursive" },
  { label: "Great Vibes (handwritten)", value: "'Great Vibes', cursive" },
];

export function simplifiedToFullTheme(simplified: SimplifiedThemeConfig | null | undefined): ThemeConfig {
  if (!simplified) return DEFAULT_THEME;
  return {
    colors: {
      bg: simplified.bg ?? DEFAULT_THEME.colors.bg,
      surface: simplified.surface ?? DEFAULT_THEME.colors.surface,
      surfaceAlt: simplified.surfaceAlt ?? DEFAULT_THEME.colors.surfaceAlt,
      border: simplified.border ?? DEFAULT_THEME.colors.border,
      text: simplified.text ?? DEFAULT_THEME.colors.text,
      heading: simplified.heading ?? DEFAULT_THEME.colors.heading,
      muted: simplified.muted ?? DEFAULT_THEME.colors.muted,
      primary: simplified.primary ?? DEFAULT_THEME.colors.primary,
      primaryHover: simplified.primaryHover ?? DEFAULT_THEME.colors.primaryHover,
      primaryFg: simplified.primaryFg ?? DEFAULT_THEME.colors.primaryFg,
      accent: simplified.accent ?? DEFAULT_THEME.colors.accent,
    },
    fonts: {
      heading: simplified.headingFont ?? DEFAULT_THEME.fonts.heading,
      body: simplified.bodyFont ?? DEFAULT_THEME.fonts.body,
      rich: simplified.richFont ?? DEFAULT_THEME.fonts.rich,
    },
    radius: simplified.radius ?? DEFAULT_THEME.radius,
    fontScale: simplified.fontScale ?? DEFAULT_THEME.fontScale,
  };
}

export function fullToSimplifiedTheme(full: ThemeConfig): SimplifiedThemeConfig {
  return {
    bg: full.colors.bg,
    surface: full.colors.surface,
    border: full.colors.border,
    text: full.colors.text,
    heading: full.colors.heading,
    muted: full.colors.muted,
    primary: full.colors.primary,
    primaryHover: full.colors.primaryHover,
    primaryFg: full.colors.primaryFg,
    accent: full.colors.accent,
    headingFont: full.fonts.heading,
    bodyFont: full.fonts.body,
    richFont: full.fonts.rich,
    radius: full.radius,
    fontScale: full.fontScale,
  };
}

export function themeToEventCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--event-bg": theme.colors.bg,
    "--event-surface": theme.colors.surface,
    "--event-surface-alt": theme.colors.surfaceAlt,
    "--event-border": theme.colors.border,
    "--event-text": theme.colors.text,
    "--event-heading": theme.colors.heading,
    "--event-muted": theme.colors.muted,
    "--event-primary": theme.colors.primary,
    "--event-primary-hover": theme.colors.primaryHover,
    "--event-primary-fg": theme.colors.primaryFg,
    "--event-accent": theme.colors.accent,
    "--event-font-heading": theme.fonts.heading,
    "--event-font-body": theme.fonts.body,
    "--event-font-rich": theme.fonts.rich,
    "--event-radius": theme.radius,
    "--event-font-scale": String(theme.fontScale),
  };
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return DEFAULT_THEME;
  }
  const obj = json as Record<string, unknown>;
  const colors = (obj.colors ?? {}) as Record<string, unknown>;
  const fonts = (obj.fonts ?? {}) as Record<string, unknown>;
  return {
    colors: {
      bg: typeof colors.bg === "string" ? colors.bg : DEFAULT_THEME.colors.bg,
      surface: typeof colors.surface === "string" ? colors.surface : DEFAULT_THEME.colors.surface,
      surfaceAlt: typeof colors.surfaceAlt === "string" ? colors.surfaceAlt : DEFAULT_THEME.colors.surfaceAlt,
      border: typeof colors.border === "string" ? colors.border : DEFAULT_THEME.colors.border,
      text: typeof colors.text === "string" ? colors.text : DEFAULT_THEME.colors.text,
      heading: typeof colors.heading === "string" ? colors.heading : DEFAULT_THEME.colors.heading,
      muted: typeof colors.muted === "string" ? colors.muted : DEFAULT_THEME.colors.muted,
      primary: typeof colors.primary === "string" ? colors.primary : DEFAULT_THEME.colors.primary,
      primaryHover: typeof colors.primaryHover === "string" ? colors.primaryHover : DEFAULT_THEME.colors.primaryHover,
      primaryFg: typeof colors.primaryFg === "string" ? colors.primaryFg : DEFAULT_THEME.colors.primaryFg,
      accent: typeof colors.accent === "string" ? colors.accent : DEFAULT_THEME.colors.accent,
    },
    fonts: {
      heading: typeof fonts.heading === "string" ? fonts.heading : DEFAULT_THEME.fonts.heading,
      body: typeof fonts.body === "string" ? fonts.body : DEFAULT_THEME.fonts.body,
      rich: typeof fonts.rich === "string" ? fonts.rich : DEFAULT_THEME.fonts.rich,
    },
    radius: typeof obj.radius === "string" ? obj.radius : DEFAULT_THEME.radius,
    fontScale: typeof obj.fontScale === "number" ? obj.fontScale : DEFAULT_THEME.fontScale,
  };
}

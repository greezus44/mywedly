import type { Json } from "./supabase";

export interface ThemeConfig {
  colors: {
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
  };
  fonts: {
    heading: string;
    body: string;
    rich: string;
  };
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
    bg: "#1a1410",
    surface: "#2a1f18",
    surfaceAlt: "rgba(255,255,255,0.05)",
    border: "#4a3828",
    text: "#f5e6d3",
    heading: "#f5e6d3",
    muted: "#c4a884",
    primary: "#c4661f",
    primaryHover: "#a5541a",
    primaryFg: "#ffffff",
    accent: "#e89043",
  },
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'EB Garamond', serif",
    rich: "'EB Garamond', serif",
  },
  radius: "0.25rem",
  fontScale: 1,
};

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  default: DEFAULT_THEME,
  rusty: RUSTY_THEME,
  blush: {
    colors: {
      bg: "#fdf2f8",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#f9d3e6",
      text: "#831843",
      heading: "#831843",
      muted: "#9d174d",
      primary: "#db2777",
      primaryHover: "#be185d",
      primaryFg: "#ffffff",
      accent: "#ec4899",
    },
    fonts: { heading: "'Playfair Display', serif", body: "Georgia, serif", rich: "Georgia, serif" },
    radius: "0.5rem",
    fontScale: 1,
  },
  sage: {
    colors: {
      bg: "#f0fdf4",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#bbf7d0",
      text: "#14532d",
      heading: "#14532d",
      muted: "#166534",
      primary: "#16a34a",
      primaryHover: "#15803d",
      primaryFg: "#ffffff",
      accent: "#22c55e",
    },
    fonts: { heading: "'Cormorant Garamond', serif", body: "Georgia, serif", rich: "Georgia, serif" },
    radius: "0.5rem",
    fontScale: 1,
  },
  navy: {
    colors: {
      bg: "#0f172a",
      surface: "#1e293b",
      surfaceAlt: "rgba(255,255,255,0.05)",
      border: "#334155",
      text: "#e2e8f0",
      heading: "#f1f5f9",
      muted: "#94a3b8",
      primary: "#3b82f6",
      primaryHover: "#2563eb",
      primaryFg: "#ffffff",
      accent: "#60a5fa",
    },
    fonts: { heading: "'Montserrat', sans-serif", body: "Inter, sans-serif", rich: "Inter, sans-serif" },
    radius: "0.375rem",
    fontScale: 1,
  },
  ivory: {
    colors: {
      bg: "#fffbeb",
      surface: "#fffdf7",
      surfaceAlt: "rgba(0,0,0,0.03)",
      border: "#e7e5e4",
      text: "#44403c",
      heading: "#292524",
      muted: "#78716c",
      primary: "#78716c",
      primaryHover: "#57534e",
      primaryFg: "#ffffff",
      accent: "#a8a29e",
    },
    fonts: { heading: "'Cardo', serif", body: "'Cardo', serif", rich: "'Cardo', serif" },
    radius: "0.125rem",
    fontScale: 1,
  },
  rose: {
    colors: {
      bg: "#fef2f2",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#fecdd3",
      text: "#7f1d1d",
      heading: "#7f1d1d",
      muted: "#991b1b",
      primary: "#dc2626",
      primaryHover: "#b91c1c",
      primaryFg: "#ffffff",
      accent: "#ef4444",
    },
    fonts: { heading: "'Great Vibes', cursive", body: "'Lora', serif", rich: "'Lora', serif" },
    radius: "0.5rem",
    fontScale: 1,
  },
  midnight: {
    colors: {
      bg: "#0c0a09",
      surface: "#1c1917",
      surfaceAlt: "rgba(255,255,255,0.05)",
      border: "#44403c",
      text: "#fafaf9",
      heading: "#fafaf9",
      muted: "#d6d3d1",
      primary: "#f59e0b",
      primaryHover: "#d97706",
      primaryFg: "#1c1917",
      accent: "#fbbf24",
    },
    fonts: { heading: "'Bodoni Moda', serif", body: "'EB Garamond', serif", rich: "'EB Garamond', serif" },
    radius: "0.25rem",
    fontScale: 1,
  },
  lavender: {
    colors: {
      bg: "#faf5ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#e9d5ff",
      text: "#581c87",
      heading: "#581c87",
      muted: "#6b21a8",
      primary: "#9333ea",
      primaryHover: "#7e22ce",
      primaryFg: "#ffffff",
      accent: "#a855f7",
    },
    fonts: { heading: "'Cormorant Garamond', serif", body: "Georgia, serif", rich: "Georgia, serif" },
    radius: "0.5rem",
    fontScale: 1,
  },
  ocean: {
    colors: {
      bg: "#ecfeff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#a5f3fc",
      text: "#164e63",
      heading: "#164e63",
      muted: "#155e75",
      primary: "#0891b2",
      primaryHover: "#0e7490",
      primaryFg: "#ffffff",
      accent: "#06b6d4",
    },
    fonts: { heading: "'Montserrat', sans-serif", body: "Inter, sans-serif", rich: "Inter, sans-serif" },
    radius: "0.375rem",
    fontScale: 1,
  },
};

export const RICH_FONT_OPTIONS = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Cardo", value: "'Cardo', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif" },
  { label: "Inter (sans)", value: "Inter, sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Caveat", value: "'Caveat', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
];

export const HEADING_FONT_OPTIONS = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Cardo", value: "'Cardo', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Caveat", value: "'Caveat', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
];

export function simplifiedToFullTheme(s: SimplifiedThemeConfig): ThemeConfig {
  const base = DEFAULT_THEME;
  return {
    colors: {
      bg: s.bg ?? base.colors.bg,
      surface: s.surface ?? base.colors.surface,
      surfaceAlt: s.surfaceAlt ?? base.colors.surfaceAlt,
      border: s.border ?? base.colors.border,
      text: s.text ?? base.colors.text,
      heading: s.heading ?? base.colors.heading,
      muted: s.muted ?? base.colors.muted,
      primary: s.primary ?? base.colors.primary,
      primaryHover: s.primaryHover ?? base.colors.primaryHover,
      primaryFg: s.primaryFg ?? base.colors.primaryFg,
      accent: s.accent ?? base.colors.accent,
    },
    fonts: {
      heading: s.headingFont ?? base.fonts.heading,
      body: s.bodyFont ?? base.fonts.body,
      rich: s.richFont ?? base.fonts.rich,
    },
    radius: s.radius ?? base.radius,
    fontScale: s.fontScale ?? base.fontScale,
  };
}

export function fullToSimplifiedTheme(t: ThemeConfig): SimplifiedThemeConfig {
  return {
    bg: t.colors.bg,
    surface: t.colors.surface,
    surfaceAlt: t.colors.surfaceAlt,
    border: t.colors.border,
    text: t.colors.text,
    heading: t.colors.heading,
    muted: t.colors.muted,
    primary: t.colors.primary,
    primaryHover: t.colors.primaryHover,
    primaryFg: t.colors.primaryFg,
    accent: t.colors.accent,
    headingFont: t.fonts.heading,
    bodyFont: t.fonts.body,
    richFont: t.fonts.rich,
    radius: t.radius,
    fontScale: t.fontScale,
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
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return DEFAULT_THEME;
  }
  const obj = json as Record<string, unknown>;
  const base = DEFAULT_THEME;
  const colorsRaw = (obj.colors ?? {}) as Record<string, unknown>;
  const fontsRaw = (obj.fonts ?? {}) as Record<string, unknown>;
  return {
    colors: {
      bg: (colorsRaw.bg as string) ?? base.colors.bg,
      surface: (colorsRaw.surface as string) ?? base.colors.surface,
      surfaceAlt: (colorsRaw.surfaceAlt as string) ?? base.colors.surfaceAlt,
      border: (colorsRaw.border as string) ?? base.colors.border,
      text: (colorsRaw.text as string) ?? base.colors.text,
      heading: (colorsRaw.heading as string) ?? base.colors.heading,
      muted: (colorsRaw.muted as string) ?? base.colors.muted,
      primary: (colorsRaw.primary as string) ?? base.colors.primary,
      primaryHover: (colorsRaw.primaryHover as string) ?? base.colors.primaryHover,
      primaryFg: (colorsRaw.primaryFg as string) ?? base.colors.primaryFg,
      accent: (colorsRaw.accent as string) ?? base.colors.accent,
    },
    fonts: {
      heading: (fontsRaw.heading as string) ?? base.fonts.heading,
      body: (fontsRaw.body as string) ?? base.fonts.body,
      rich: (fontsRaw.rich as string) ?? base.fonts.rich,
    },
    radius: (obj.radius as string) ?? base.radius,
    fontScale: typeof obj.fontScale === "number" ? obj.fontScale : base.fontScale,
  };
}

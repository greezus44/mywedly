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
  primary?: string;
  primaryHover?: string;
  primaryFg?: string;
  accent?: string;
  heading?: string;
  text?: string;
  muted?: string;
  border?: string;
  surfaceAlt?: string;
  fontHeading?: string;
  fontBody?: string;
  fontRich?: string;
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
    bg: "#1c1410",
    surface: "#2a1f18",
    surfaceAlt: "rgba(255,255,255,0.05)",
    border: "#5a4a3f",
    text: "#e8d5c4",
    heading: "#f4e4d4",
    muted: "#b8a394",
    primary: "#c8794a",
    primaryHover: "#b06a3d",
    primaryFg: "#1c1410",
    accent: "#e0996a",
  },
  fonts: {
    heading: "'Playfair Display', Georgia, serif",
    body: "'Lora', Georgia, serif",
    rich: "'Lora', Georgia, serif",
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
      surfaceAlt: "rgba(255,255,255,0.1)",
      border: "#f9c5df",
      text: "#831843",
      heading: "#831843",
      muted: "#9d4470",
      primary: "#db2777",
      primaryHover: "#be185d",
      primaryFg: "#ffffff",
      accent: "#ec4899",
    },
    fonts: {
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "'Montserrat', sans-serif",
      rich: "'Montserrat', sans-serif",
    },
    radius: "0.75rem",
    fontScale: 1,
  },
  sage: {
    colors: {
      bg: "#f0fdf4",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.1)",
      border: "#bbf7d0",
      text: "#14532d",
      heading: "#14532d",
      muted: "#3f6b54",
      primary: "#16a34a",
      primaryHover: "#15803d",
      primaryFg: "#ffffff",
      accent: "#22c55e",
    },
    fonts: {
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "'Inter', sans-serif",
      rich: "'Inter', sans-serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  midnight: {
    colors: {
      bg: "#0f172a",
      surface: "#1e293b",
      surfaceAlt: "rgba(255,255,255,0.05)",
      border: "#334155",
      text: "#e2e8f0",
      heading: "#f1f5f9",
      muted: "#94a3b8",
      primary: "#6366f1",
      primaryHover: "#4f46e5",
      primaryFg: "#ffffff",
      accent: "#818cf8",
    },
    fonts: {
      heading: "'Playfair Display', Georgia, serif",
      body: "'Inter', sans-serif",
      rich: "'Inter', sans-serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  ivory: {
    colors: {
      bg: "#fefce8",
      surface: "#ffffff",
      surfaceAlt: "rgba(0,0,0,0.03)",
      border: "#fde68a",
      text: "#422006",
      heading: "#422006",
      muted: "#78350f",
      primary: "#a16207",
      primaryHover: "#854d0e",
      primaryFg: "#ffffff",
      accent: "#ca8a04",
    },
    fonts: {
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "'Lora', Georgia, serif",
      rich: "'Lora', Georgia, serif",
    },
    radius: "0.25rem",
    fontScale: 1,
  },
  ocean: {
    colors: {
      bg: "#f0f9ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.1)",
      border: "#bae6fd",
      text: "#0c4a6e",
      heading: "#0c4a6e",
      muted: "#0369a1",
      primary: "#0284c7",
      primaryHover: "#0369a1",
      primaryFg: "#ffffff",
      accent: "#0ea5e9",
    },
    fonts: {
      heading: "'Playfair Display', Georgia, serif",
      body: "'Inter', sans-serif",
      rich: "'Inter', sans-serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  lavender: {
    colors: {
      bg: "#faf5ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.1)",
      border: "#e9d5ff",
      text: "#581c87",
      heading: "#581c87",
      muted: "#7e22ce",
      primary: "#9333ea",
      primaryHover: "#7e22ce",
      primaryFg: "#ffffff",
      accent: "#a855f7",
    },
    fonts: {
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "'Inter', sans-serif",
      rich: "'Inter', sans-serif",
    },
    radius: "0.75rem",
    fontScale: 1,
  },
  charcoal: {
    colors: {
      bg: "#18181b",
      surface: "#27272a",
      surfaceAlt: "rgba(255,255,255,0.05)",
      border: "#3f3f46",
      text: "#e4e4e7",
      heading: "#fafafa",
      muted: "#a1a1aa",
      primary: "#f4f4f5",
      primaryHover: "#e4e4e7",
      primaryFg: "#18181b",
      accent: "#d4d4d8",
    },
    fonts: {
      heading: "'Playfair Display', Georgia, serif",
      body: "'Inter', sans-serif",
      rich: "'Inter', sans-serif",
    },
    radius: "0.25rem",
    fontScale: 1,
  },
  coral: {
    colors: {
      bg: "#fff7ed",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.1)",
      border: "#fed7aa",
      text: "#7c2d12",
      heading: "#7c2d12",
      muted: "#c2410c",
      primary: "#ea580c",
      primaryHover: "#c2410c",
      primaryFg: "#ffffff",
      accent: "#f97316",
    },
    fonts: {
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "'Lora', Georgia, serif",
      rich: "'Lora', Georgia, serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  forest: {
    colors: {
      bg: "#f7fee7",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.1)",
      border: "#d9f99d",
      text: "#365314",
      heading: "#365314",
      muted: "#65a30d",
      primary: "#65a30d",
      primaryHover: "#4d7c0f",
      primaryFg: "#ffffff",
      accent: "#84cc16",
    },
    fonts: {
      heading: "'Playfair Display', Georgia, serif",
      body: "'Inter', sans-serif",
      rich: "'Inter', sans-serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
};

export const RICH_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Merriweather", value: "'Merriweather', Georgia, serif" },
  { label: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
  { label: "Inter (sans)", value: "'Inter', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Roboto Slab", value: "'Roboto Slab', Georgia, serif" },
  { label: "Source Serif Pro", value: "'Source Serif Pro', Georgia, serif" },
];

export const HEADING_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "Merriweather", value: "'Merriweather', Georgia, serif" },
  { label: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
  { label: "Inter (sans)", value: "'Inter', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Roboto Slab", value: "'Roboto Slab', Georgia, serif" },
  { label: "Source Serif Pro", value: "'Source Serif Pro', Georgia, serif" },
];

export function simplifiedToFullTheme(s: SimplifiedThemeConfig | null | undefined): ThemeConfig {
  const base = DEFAULT_THEME;
  if (!s) return base;
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
      heading: s.fontHeading ?? base.fonts.heading,
      body: s.fontBody ?? base.fonts.body,
      rich: s.fontRich ?? base.fonts.rich,
    },
    radius: s.radius ?? base.radius,
    fontScale: s.fontScale ?? base.fontScale,
  };
}

export function fullToSimplifiedTheme(t: ThemeConfig | null | undefined): SimplifiedThemeConfig {
  if (!t) return {};
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
    fontHeading: t.fonts.heading,
    fontBody: t.fonts.body,
    fontRich: t.fonts.rich,
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

export function slugify(text: string): string {
  return text
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
  const colors = (obj.colors ?? {}) as Record<string, unknown>;
  const fonts = (obj.fonts ?? {}) as Record<string, unknown>;
  const base = DEFAULT_THEME;
  return {
    colors: {
      bg: (colors.bg as string) ?? base.colors.bg,
      surface: (colors.surface as string) ?? base.colors.surface,
      surfaceAlt: (colors.surfaceAlt as string) ?? base.colors.surfaceAlt,
      border: (colors.border as string) ?? base.colors.border,
      text: (colors.text as string) ?? base.colors.text,
      heading: (colors.heading as string) ?? base.colors.heading,
      muted: (colors.muted as string) ?? base.colors.muted,
      primary: (colors.primary as string) ?? base.colors.primary,
      primaryHover: (colors.primaryHover as string) ?? base.colors.primaryHover,
      primaryFg: (colors.primaryFg as string) ?? base.colors.primaryFg,
      accent: (colors.accent as string) ?? base.colors.accent,
    },
    fonts: {
      heading: (fonts.heading as string) ?? base.fonts.heading,
      body: (fonts.body as string) ?? base.fonts.body,
      rich: (fonts.rich as string) ?? base.fonts.rich,
    },
    radius: (obj.radius as string) ?? base.radius,
    fontScale: typeof obj.fontScale === "number" ? obj.fontScale : base.fontScale,
  };
}

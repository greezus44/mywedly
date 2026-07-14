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
    bg: "#1c1917",
    surface: "#292524",
    surfaceAlt: "rgba(255,255,255,0.05)",
    border: "#44403c",
    text: "#f5f5f4",
    heading: "#fef3c7",
    muted: "#a8a29e",
    primary: "#d97706",
    primaryHover: "#b45309",
    primaryFg: "#ffffff",
    accent: "#f59e0b",
  },
  fonts: {
    heading: "'Playfair Display', serif",
    body: "Inter, sans-serif",
    rich: "'Cormorant Garamond', serif",
  },
  radius: "0.5rem",
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
      body: "Inter, sans-serif",
      rich: "'Cormorant Garamond', serif",
    },
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
      heading: "#166534",
      muted: "#15803d",
      primary: "#16a34a",
      primaryHover: "#15803d",
      primaryFg: "#ffffff",
      accent: "#22c55e",
    },
    fonts: {
      heading: "'EB Garamond', serif",
      body: "Inter, sans-serif",
      rich: "'Lora', serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  navy: {
    colors: {
      bg: "#f8fafc",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#cbd5e1",
      text: "#0f172a",
      heading: "#1e293b",
      muted: "#475569",
      primary: "#1e40af",
      primaryHover: "#1e3a8a",
      primaryFg: "#ffffff",
      accent: "#3b82f6",
    },
    fonts: {
      heading: "'Bodoni Moda', serif",
      body: "Inter, sans-serif",
      rich: "'Cardo', serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  lavender: {
    colors: {
      bg: "#faf5ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#e9d5ff",
      text: "#3b0764",
      heading: "#5b21b6",
      muted: "#6b21a8",
      primary: "#7c3aed",
      primaryHover: "#6d28d9",
      primaryFg: "#ffffff",
      accent: "#a855f7",
    },
    fonts: {
      heading: "'Cormorant Garamond', serif",
      body: "Inter, sans-serif",
      rich: "'EB Garamond', serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  terracotta: {
    colors: {
      bg: "#fdf4f0",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#fed7aa",
      text: "#7c2d12",
      heading: "#9a3412",
      muted: "#c2410c",
      primary: "#ea580c",
      primaryHover: "#c2410c",
      primaryFg: "#ffffff",
      accent: "#f97316",
    },
    fonts: {
      heading: "'Lora', serif",
      body: "Inter, sans-serif",
      rich: "'EB Garamond', serif",
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
      heading: "'Playfair Display', serif",
      body: "Inter, sans-serif",
      rich: "'Cormorant Garamond', serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  forest: {
    colors: {
      bg: "#f0fdf4",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#a7f3d0",
      text: "#064e3b",
      heading: "#065f46",
      muted: "#047857",
      primary: "#059669",
      primaryHover: "#047857",
      primaryFg: "#ffffff",
      accent: "#10b981",
    },
    fonts: {
      heading: "'Cardo', serif",
      body: "Inter, sans-serif",
      rich: "'Lora', serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  rose: {
    colors: {
      bg: "#fff7f7",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#fecdd3",
      text: "#881337",
      heading: "#9f1239",
      muted: "#be123c",
      primary: "#e11d48",
      primaryHover: "#be123c",
      primaryFg: "#ffffff",
      accent: "#f43f5e",
    },
    fonts: {
      heading: "'Dancing Script', cursive",
      body: "Inter, sans-serif",
      rich: "'Cormorant Garamond', serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  gold: {
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
      heading: "'Great Vibes', cursive",
      body: "Inter, sans-serif",
      rich: "'EB Garamond', serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
};

export const RICH_FONT_OPTIONS = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Cardo", value: "'Cardo', serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Caveat", value: "'Caveat', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
];

export const HEADING_FONT_OPTIONS = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif" },
  { label: "Cardo", value: "'Cardo', serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Caveat", value: "'Caveat', cursive" },
];

export function simplifiedToFullTheme(simplified: SimplifiedThemeConfig): ThemeConfig {
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
      heading: simplified.fontHeading ?? DEFAULT_THEME.fonts.heading,
      body: simplified.fontBody ?? DEFAULT_THEME.fonts.body,
      rich: simplified.fontRich ?? DEFAULT_THEME.fonts.rich,
    },
    radius: simplified.radius ?? DEFAULT_THEME.radius,
    fontScale: simplified.fontScale ?? DEFAULT_THEME.fontScale,
  };
}

export function fullToSimplifiedTheme(theme: ThemeConfig): SimplifiedThemeConfig {
  return {
    bg: theme.colors.bg,
    surface: theme.colors.surface,
    surfaceAlt: theme.colors.surfaceAlt,
    border: theme.colors.border,
    text: theme.colors.text,
    heading: theme.colors.heading,
    muted: theme.colors.muted,
    primary: theme.colors.primary,
    primaryHover: theme.colors.primaryHover,
    primaryFg: theme.colors.primaryFg,
    accent: theme.colors.accent,
    fontHeading: theme.fonts.heading,
    fontBody: theme.fonts.body,
    fontRich: theme.fonts.rich,
    radius: theme.radius,
    fontScale: theme.fontScale,
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
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length <= 64;
}

export function jsonToTheme(theme: Json | null | undefined): ThemeConfig {
  if (!theme || typeof theme !== "object" || Array.isArray(theme)) {
    return DEFAULT_THEME;
  }
  const t = theme as Record<string, unknown>;
  const colorsIn = (t.colors && typeof t.colors === "object" && !Array.isArray(t.colors) ? t.colors : {}) as Record<string, unknown>;
  const fontsIn = (t.fonts && typeof t.fonts === "object" && !Array.isArray(t.fonts) ? t.fonts : {}) as Record<string, unknown>;
  const colors: ThemeColors = {
    bg: (colorsIn.bg as string) ?? DEFAULT_THEME.colors.bg,
    surface: (colorsIn.surface as string) ?? DEFAULT_THEME.colors.surface,
    surfaceAlt: (colorsIn.surfaceAlt as string) ?? DEFAULT_THEME.colors.surfaceAlt,
    border: (colorsIn.border as string) ?? DEFAULT_THEME.colors.border,
    text: (colorsIn.text as string) ?? DEFAULT_THEME.colors.text,
    heading: (colorsIn.heading as string) ?? DEFAULT_THEME.colors.heading,
    muted: (colorsIn.muted as string) ?? DEFAULT_THEME.colors.muted,
    primary: (colorsIn.primary as string) ?? DEFAULT_THEME.colors.primary,
    primaryHover: (colorsIn.primaryHover as string) ?? DEFAULT_THEME.colors.primaryHover,
    primaryFg: (colorsIn.primaryFg as string) ?? DEFAULT_THEME.colors.primaryFg,
    accent: (colorsIn.accent as string) ?? DEFAULT_THEME.colors.accent,
  };
  const fonts: ThemeFonts = {
    heading: (fontsIn.heading as string) ?? DEFAULT_THEME.fonts.heading,
    body: (fontsIn.body as string) ?? DEFAULT_THEME.fonts.body,
    rich: (fontsIn.rich as string) ?? DEFAULT_THEME.fonts.rich,
  };
  return {
    colors,
    fonts,
    radius: (t.radius as string) ?? DEFAULT_THEME.radius,
    fontScale: typeof t.fontScale === "number" ? t.fontScale : DEFAULT_THEME.fontScale,
  };
}

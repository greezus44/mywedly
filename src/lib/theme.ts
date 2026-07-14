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
    bg: "#2a1f1a",
    surface: "#3d2e25",
    surfaceAlt: "rgba(255,255,255,0.06)",
    border: "#5c4536",
    text: "#e8d5c4",
    heading: "#f5e6d3",
    muted: "#c4a890",
    primary: "#c8794a",
    primaryHover: "#b5673a",
    primaryFg: "#2a1f1a",
    accent: "#d4a574",
  },
  fonts: {
    heading: "'Playfair Display', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    rich: "'EB Garamond', Georgia, serif",
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
      surfaceAlt: "rgba(255,255,255,0.1)",
      border: "#f9c5dc",
      text: "#831843",
      heading: "#9d174d",
      muted: "#be185d",
      primary: "#db2777",
      primaryHover: "#be185d",
      primaryFg: "#ffffff",
      accent: "#ec4899",
    },
    fonts: {
      heading: "'Playfair Display', Georgia, serif",
      body: "'Lora', Georgia, serif",
      rich: "'Cardo', Georgia, serif",
    },
    radius: "0.75rem",
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
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "'Lora', Georgia, serif",
      rich: "'EB Garamond', Georgia, serif",
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
      text: "#cbd5e1",
      heading: "#f1f5f9",
      muted: "#94a3b8",
      primary: "#6366f1",
      primaryHover: "#4f46e5",
      primaryFg: "#ffffff",
      accent: "#818cf8",
    },
    fonts: {
      heading: "'Bodoni Moda', Georgia, serif",
      body: "'Montserrat', sans-serif",
      rich: "'Cardo', Georgia, serif",
    },
    radius: "0.375rem",
    fontScale: 0.95,
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
      heading: "'EB Garamond', Georgia, serif",
      body: "'Cardo', Georgia, serif",
      rich: "'EB Garamond', Georgia, serif",
    },
    radius: "0.25rem",
    fontScale: 1.1,
  },
  ocean: {
    colors: {
      bg: "#ecfeff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#a5f3fc",
      text: "#164e63",
      heading: "#155e75",
      muted: "#0e7490",
      primary: "#0891b2",
      primaryHover: "#0e7490",
      primaryFg: "#ffffff",
      accent: "#06b6d4",
    },
    fonts: {
      heading: "'Montserrat', sans-serif",
      body: "'Lora', Georgia, serif",
      rich: "'Cardo', Georgia, serif",
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
      text: "#581c87",
      heading: "#6b21a8",
      muted: "#7e22ce",
      primary: "#9333ea",
      primaryHover: "#7e22ce",
      primaryFg: "#ffffff",
      accent: "#a855f7",
    },
    fonts: {
      heading: "'Playfair Display', Georgia, serif",
      body: "'Cormorant Garamond', Georgia, serif",
      rich: "'EB Garamond', Georgia, serif",
    },
    radius: "0.625rem",
    fontScale: 1,
  },
  coral: {
    colors: {
      bg: "#fff7ed",
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
      heading: "'Bodoni Moda', Georgia, serif",
      body: "'Lora', Georgia, serif",
      rich: "'Cardo', Georgia, serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  forest: {
    colors: {
      bg: "#1a2e1a",
      surface: "#243d24",
      surfaceAlt: "rgba(255,255,255,0.06)",
      border: "#3d5a3d",
      text: "#d4e8d4",
      heading: "#e0f0e0",
      muted: "#a8c8a8",
      primary: "#7cb342",
      primaryHover: "#689f38",
      primaryFg: "#1a2e1a",
      accent: "#aed581",
    },
    fonts: {
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "'EB Garamond', Georgia, serif",
      rich: "'Cardo', Georgia, serif",
    },
    radius: "0.375rem",
    fontScale: 1.05,
  },
};

export const RICH_FONT_OPTIONS = [
  { label: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
  { label: "Cardo", value: "'Cardo', Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', Georgia, serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Caveat", value: "'Caveat', cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
];

export const HEADING_FONT_OPTIONS = [
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', Georgia, serif" },
  { label: "Cardo", value: "'Cardo', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Caveat", value: "'Caveat', cursive" },
];

export function simplifiedToFullTheme(s: SimplifiedThemeConfig): ThemeConfig {
  return {
    colors: {
      bg: s.bg ?? DEFAULT_THEME.colors.bg,
      surface: s.surface ?? DEFAULT_THEME.colors.surface,
      surfaceAlt: s.surfaceAlt ?? DEFAULT_THEME.colors.surfaceAlt,
      border: s.border ?? DEFAULT_THEME.colors.border,
      text: s.text ?? DEFAULT_THEME.colors.text,
      heading: s.heading ?? DEFAULT_THEME.colors.heading,
      muted: s.muted ?? DEFAULT_THEME.colors.muted,
      primary: s.primary ?? DEFAULT_THEME.colors.primary,
      primaryHover: s.primaryHover ?? DEFAULT_THEME.colors.primaryHover,
      primaryFg: s.primaryFg ?? DEFAULT_THEME.colors.primaryFg,
      accent: s.accent ?? DEFAULT_THEME.colors.accent,
    },
    fonts: {
      heading: s.headingFont ?? DEFAULT_THEME.fonts.heading,
      body: s.bodyFont ?? DEFAULT_THEME.fonts.body,
      rich: s.richFont ?? DEFAULT_THEME.fonts.rich,
    },
    radius: s.radius ?? DEFAULT_THEME.radius,
    fontScale: s.fontScale ?? DEFAULT_THEME.fontScale,
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
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length >= 2 && slug.length <= 80;
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return DEFAULT_THEME;
  }
  const obj = json as Record<string, unknown>;
  const rawColors = obj.colors;
  const rawFonts = obj.fonts;
  const colors: ThemeColors = { ...DEFAULT_THEME.colors };
  if (rawColors && typeof rawColors === "object" && !Array.isArray(rawColors)) {
    const c = rawColors as Record<string, unknown>;
    for (const key of Object.keys(colors) as (keyof ThemeColors)[]) {
      if (typeof c[key] === "string") colors[key] = c[key] as string;
    }
  }
  const fonts: ThemeFonts = { ...DEFAULT_THEME.fonts };
  if (rawFonts && typeof rawFonts === "object" && !Array.isArray(rawFonts)) {
    const f = rawFonts as Record<string, unknown>;
    if (typeof f.heading === "string") fonts.heading = f.heading;
    if (typeof f.body === "string") fonts.body = f.body;
    if (typeof f.rich === "string") fonts.rich = f.rich;
  }
  const radius = typeof obj.radius === "string" ? obj.radius : DEFAULT_THEME.radius;
  const fontScale = typeof obj.fontScale === "number" ? obj.fontScale : DEFAULT_THEME.fontScale;
  return { colors, fonts, radius, fontScale };
}

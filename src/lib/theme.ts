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
  border?: string;
  text?: string;
  heading?: string;
  muted?: string;
  primary?: string;
  primaryHover?: string;
  primaryFg?: string;
  accent?: string;
  surfaceAlt?: string;
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
    bg: "#1c1410",
    surface: "#2a1f17",
    surfaceAlt: "rgba(255,255,255,0.05)",
    border: "#3d2e22",
    text: "#e7d5c4",
    heading: "#f4e4d4",
    muted: "#a8917a",
    primary: "#c2876b",
    primaryHover: "#a86f55",
    primaryFg: "#1c1410",
    accent: "#d4a373",
  },
  fonts: {
    heading: "Playfair Display, serif",
    body: "Lora, serif",
    rich: "Lora, serif",
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
      border: "#fbcfe8",
      text: "#831843",
      heading: "#9d174d",
      muted: "#be185d",
      primary: "#db2777",
      primaryHover: "#be185d",
      primaryFg: "#ffffff",
      accent: "#ec4899",
    },
    fonts: { heading: "Cormorant Garamond, serif", body: "Lora, serif", rich: "Lora, serif" },
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
    fonts: { heading: "Montserrat, sans-serif", body: "Lora, serif", rich: "Lora, serif" },
    radius: "0.375rem",
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
    fonts: { heading: "Playfair Display, serif", body: "Inter, sans-serif", rich: "Inter, sans-serif" },
    radius: "0.5rem",
    fontScale: 1,
  },
  ivory: {
    colors: {
      bg: "#fffbeb",
      surface: "#fffef7",
      surfaceAlt: "rgba(0,0,0,0.03)",
      border: "#e7e5e4",
      text: "#44403c",
      heading: "#1c1917",
      muted: "#78716c",
      primary: "#a8a29e",
      primaryHover: "#78716c",
      primaryFg: "#ffffff",
      accent: "#d6d3d1",
    },
    fonts: { heading: "Cardo, serif", body: "EB Garamond, serif", rich: "EB Garamond, serif" },
    radius: "0.125rem",
    fontScale: 1,
  },
  royal: {
    colors: {
      bg: "#faf5ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#e9d5ff",
      text: "#4c1d95",
      heading: "#4c1d95",
      muted: "#6b21a8",
      primary: "#7c3aed",
      primaryHover: "#6d28d9",
      primaryFg: "#ffffff",
      accent: "#a855f7",
    },
    fonts: { heading: "Bodoni Moda, serif", body: "Lora, serif", rich: "Lora, serif" },
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
      heading: "#155e75",
      muted: "#0e7490",
      primary: "#0891b2",
      primaryHover: "#0e7490",
      primaryFg: "#ffffff",
      accent: "#06b6d4",
    },
    fonts: { heading: "Montserrat, sans-serif", body: "Inter, sans-serif", rich: "Inter, sans-serif" },
    radius: "0.5rem",
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
      accent: "#fb923c",
    },
    fonts: { heading: "Dancing Script, cursive", body: "Lora, serif", rich: "Lora, serif" },
    radius: "0.75rem",
    fontScale: 1,
  },
  charcoal: {
    colors: {
      bg: "#18181b",
      surface: "#27272a",
      surfaceAlt: "rgba(255,255,255,0.05)",
      border: "#3f3f46",
      text: "#d4d4d8",
      heading: "#fafafa",
      muted: "#a1a1aa",
      primary: "#e4e4e7",
      primaryHover: "#d4d4d8",
      primaryFg: "#18181b",
      accent: "#a1a1aa",
    },
    fonts: { heading: "Inter, sans-serif", body: "Inter, sans-serif", rich: "Inter, sans-serif" },
    radius: "0.25rem",
    fontScale: 1,
  },
};

export const RICH_FONT_OPTIONS = [
  { label: "Lora", value: "Lora, serif" },
  { label: "EB Garamond", value: "EB Garamond, serif" },
  { label: "Cardo", value: "Cardo, serif" },
  { label: "Cormorant Garamond", value: "Cormorant Garamond, serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Playfair Display", value: "Playfair Display, serif" },
  { label: "Bodoni Moda", value: "Bodoni Moda, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Dancing Script", value: "Dancing Script, cursive" },
  { label: "Great Vibes", value: "Great Vibes, cursive" },
  { label: "Caveat", value: "Caveat, cursive" },
];

export const HEADING_FONT_OPTIONS = [
  { label: "Playfair Display", value: "Playfair Display, serif" },
  { label: "Cormorant Garamond", value: "Cormorant Garamond, serif" },
  { label: "Bodoni Moda", value: "Bodoni Moda, serif" },
  { label: "Cardo", value: "Cardo, serif" },
  { label: "EB Garamond", value: "EB Garamond, serif" },
  { label: "Lora", value: "Lora, serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Dancing Script", value: "Dancing Script, cursive" },
  { label: "Great Vibes", value: "Great Vibes, cursive" },
  { label: "Caveat", value: "Caveat, cursive" },
];

export function simplifiedToFullTheme(simplified: SimplifiedThemeConfig): ThemeConfig {
  const base = DEFAULT_THEME;
  return {
    colors: {
      bg: simplified.bg ?? base.colors.bg,
      surface: simplified.surface ?? base.colors.surface,
      surfaceAlt: simplified.surfaceAlt ?? base.colors.surfaceAlt,
      border: simplified.border ?? base.colors.border,
      text: simplified.text ?? base.colors.text,
      heading: simplified.heading ?? base.colors.heading,
      muted: simplified.muted ?? base.colors.muted,
      primary: simplified.primary ?? base.colors.primary,
      primaryHover: simplified.primaryHover ?? base.colors.primaryHover,
      primaryFg: simplified.primaryFg ?? base.colors.primaryFg,
      accent: simplified.accent ?? base.colors.accent,
    },
    fonts: {
      heading: simplified.headingFont ?? base.fonts.heading,
      body: simplified.bodyFont ?? base.fonts.body,
      rich: simplified.richFont ?? base.fonts.rich,
    },
    radius: simplified.radius ?? base.radius,
    fontScale: simplified.fontScale ?? base.fontScale,
  };
}

export function fullToSimplifiedTheme(full: ThemeConfig): SimplifiedThemeConfig {
  return {
    bg: full.colors.bg,
    surface: full.colors.surface,
    surfaceAlt: full.colors.surfaceAlt,
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
    .replace(/[\s_-]+/g, "-")
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
  const colors = (obj.colors ?? {}) as Record<string, unknown>;
  const fonts = (obj.fonts ?? {}) as Record<string, unknown>;
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

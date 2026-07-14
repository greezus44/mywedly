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

export interface SimplifiedThemeColors {
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
    surface: "#2a2018",
    surfaceAlt: "rgba(255,255,255,0.05)",
    border: "#5a4030",
    text: "#e8d5c4",
    heading: "#f5e6d3",
    muted: "#c4a884",
    primary: "#c8702a",
    primaryHover: "#b85a1a",
    primaryFg: "#ffffff",
    accent: "#e89048",
  },
  fonts: {
    heading: "'Playfair Display', Georgia, serif",
    body: "Georgia, serif",
    rich: "'EB Garamond', Georgia, serif",
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
      border: "#f9c5d8",
      text: "#831843",
      heading: "#9d174d",
      muted: "#be185d",
      primary: "#db2777",
      primaryHover: "#be185d",
      primaryFg: "#ffffff",
      accent: "#ec4899",
    },
    fonts: {
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "Georgia, serif",
      rich: "'EB Garamond', Georgia, serif",
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
      heading: "'Lora', Georgia, serif",
      body: "Georgia, serif",
      rich: "'EB Garamond', Georgia, serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  midnight: {
    colors: {
      bg: "#0f172a",
      surface: "#1e293b",
      surfaceAlt: "rgba(255,255,255,0.06)",
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
      heading: "'Montserrat', sans-serif",
      body: "'Inter', sans-serif",
      rich: "'EB Garamond', Georgia, serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  ivory: {
    colors: {
      bg: "#fefce8",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#fef3c7",
      text: "#44403c",
      heading: "#292524",
      muted: "#78716c",
      primary: "#a8a29e",
      primaryHover: "#78716c",
      primaryFg: "#ffffff",
      accent: "#d6d3d1",
    },
    fonts: {
      heading: "'Cardo', Georgia, serif",
      body: "Georgia, serif",
      rich: "'EB Garamond', Georgia, serif",
    },
    radius: "0.25rem",
    fontScale: 1,
  },
  royal: {
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
      heading: "'Bodoni Moda', Georgia, serif",
      body: "Georgia, serif",
      rich: "'EB Garamond', Georgia, serif",
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
      primary: "#0ea5e9",
      primaryHover: "#0284c7",
      primaryFg: "#ffffff",
      accent: "#38bdf8",
    },
    fonts: {
      heading: "'Montserrat', sans-serif",
      body: "'Inter', sans-serif",
      rich: "'EB Garamond', Georgia, serif",
    },
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
    fonts: {
      heading: "'Playfair Display', Georgia, serif",
      body: "Georgia, serif",
      rich: "'EB Garamond', Georgia, serif",
    },
    radius: "0.5rem",
    fontScale: 1,
  },
  forest: {
    colors: {
      bg: "#f5f5f0",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#d6d3d1",
      text: "#1c2b1c",
      heading: "#1c2b1c",
      muted: "#4b5d4b",
      primary: "#4b5d4b",
      primaryHover: "#3a4a3a",
      primaryFg: "#ffffff",
      accent: "#6b7d6b",
    },
    fonts: {
      heading: "'Cormorant Garamond', Georgia, serif",
      body: "Georgia, serif",
      rich: "'EB Garamond', Georgia, serif",
    },
    radius: "0.25rem",
    fontScale: 1,
  },
};

export const RICH_FONT_OPTIONS = [
  { label: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "Cardo", value: "'Cardo', Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', Georgia, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Caveat", value: "'Caveat', cursive" },
];

export const HEADING_FONT_OPTIONS = [
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', Georgia, serif" },
  { label: "Cardo", value: "'Cardo', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Caveat", value: "'Caveat', cursive" },
  { label: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?$/.test(slug) && slug.length > 0;
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
      bg: (colors.bg as string) ?? DEFAULT_THEME.colors.bg,
      surface: (colors.surface as string) ?? DEFAULT_THEME.colors.surface,
      surfaceAlt: (colors.surfaceAlt as string) ?? DEFAULT_THEME.colors.surfaceAlt,
      border: (colors.border as string) ?? DEFAULT_THEME.colors.border,
      text: (colors.text as string) ?? DEFAULT_THEME.colors.text,
      heading: (colors.heading as string) ?? DEFAULT_THEME.colors.heading,
      muted: (colors.muted as string) ?? DEFAULT_THEME.colors.muted,
      primary: (colors.primary as string) ?? DEFAULT_THEME.colors.primary,
      primaryHover: (colors.primaryHover as string) ?? DEFAULT_THEME.colors.primaryHover,
      primaryFg: (colors.primaryFg as string) ?? DEFAULT_THEME.colors.primaryFg,
      accent: (colors.accent as string) ?? DEFAULT_THEME.colors.accent,
    },
    fonts: {
      heading: (fonts.heading as string) ?? DEFAULT_THEME.fonts.heading,
      body: (fonts.body as string) ?? DEFAULT_THEME.fonts.body,
      rich: (fonts.rich as string) ?? DEFAULT_THEME.fonts.rich,
    },
    radius: (obj.radius as string) ?? DEFAULT_THEME.radius,
    fontScale: typeof obj.fontScale === "number" ? obj.fontScale : DEFAULT_THEME.fontScale,
  };
}

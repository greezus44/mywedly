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
}

export interface SimplifiedThemeFonts {
  heading?: string;
  body?: string;
  rich?: string;
}

export interface SimplifiedThemeConfig {
  colors?: SimplifiedThemeColors;
  fonts?: SimplifiedThemeFonts;
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
    surfaceAlt: "rgba(255,255,255,0.06)",
    border: "#57534e",
    text: "#f5f5f4",
    heading: "#fbbf24",
    muted: "#d6d3d1",
    primary: "#f59e0b",
    primaryHover: "#d97706",
    primaryFg: "#1c1917",
    accent: "#b45309",
  },
  fonts: {
    heading: "Bodoni Moda, serif",
    body: "Cardo, serif",
    rich: "Cardo, serif",
  },
  radius: "0.375rem",
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
      primary: "#ec4899",
      primaryHover: "#db2777",
      primaryFg: "#ffffff",
      accent: "#f472b6",
    },
    fonts: { heading: "Playfair Display, serif", body: "Lora, serif", rich: "Lora, serif" },
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
      accent: "#4ade80",
    },
    fonts: { heading: "Cormorant Garamond, serif", body: "EB Garamond, serif", rich: "EB Garamond, serif" },
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
      heading: "#c7d2fe",
      muted: "#94a3b8",
      primary: "#818cf8",
      primaryHover: "#6366f1",
      primaryFg: "#0f172a",
      accent: "#a5b4fc",
    },
    fonts: { heading: "Montserrat, sans-serif", body: "Inter, sans-serif", rich: "Inter, sans-serif" },
    radius: "0.5rem",
    fontScale: 1,
  },
  cream: {
    colors: {
      bg: "#fefce8",
      surface: "#fffef5",
      surfaceAlt: "rgba(0,0,0,0.04)",
      border: "#fde68a",
      text: "#422006",
      heading: "#713f12",
      muted: "#854d0e",
      primary: "#ca8a04",
      primaryHover: "#a16207",
      primaryFg: "#ffffff",
      accent: "#eab308",
    },
    fonts: { heading: "EB Garamond, serif", body: "Cardo, serif", rich: "Cardo, serif" },
    radius: "0.625rem",
    fontScale: 1.05,
  },
  rose: {
    colors: {
      bg: "#fff7f5",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.1)",
      border: "#fecdd3",
      text: "#881337",
      heading: "#9f1239",
      muted: "#be123c",
      primary: "#e11d48",
      primaryHover: "#be123c",
      primaryFg: "#ffffff",
      accent: "#fb7185",
    },
    fonts: { heading: "Great Vibes, cursive", body: "Lora, serif", rich: "Lora, serif" },
    radius: "0.875rem",
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
      accent: "#22d3ee",
    },
    fonts: { heading: "Montserrat, sans-serif", body: "Inter, sans-serif", rich: "Inter, sans-serif" },
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
      accent: "#c084fc",
    },
    fonts: { heading: "Playfair Display, serif", body: "Lora, serif", rich: "Lora, serif" },
    radius: "0.625rem",
    fontScale: 1,
  },
  forest: {
    colors: {
      bg: "#052e16",
      surface: "#14532d",
      surfaceAlt: "rgba(255,255,255,0.06)",
      border: "#166534",
      text: "#dcfce7",
      heading: "#bbf7d0",
      muted: "#86efac",
      primary: "#22c55e",
      primaryHover: "#16a34a",
      primaryFg: "#052e16",
      accent: "#4ade80",
    },
    fonts: { heading: "Cormorant Garamond, serif", body: "EB Garamond, serif", rich: "EB Garamond, serif" },
    radius: "0.375rem",
    fontScale: 1.05,
  },
};

export const RICH_FONT_OPTIONS: string[] = [
  "Georgia, serif",
  "Cardo, serif",
  "EB Garamond, serif",
  "Cormorant Garamond, serif",
  "Lora, serif",
  "Playfair Display, serif",
  "Bodoni Moda, serif",
  "Inter, sans-serif",
  "Montserrat, sans-serif",
  "Caveat, cursive",
  "Dancing Script, cursive",
  "Great Vibes, cursive",
];

export const HEADING_FONT_OPTIONS: string[] = [
  "Georgia, serif",
  "Playfair Display, serif",
  "Cormorant Garamond, serif",
  "Bodoni Moda, serif",
  "Cardo, serif",
  "EB Garamond, serif",
  "Lora, serif",
  "Montserrat, sans-serif",
  "Inter, sans-serif",
  "Great Vibes, cursive",
  "Dancing Script, cursive",
  "Caveat, cursive",
];

export function simplifiedToFullTheme(simplified: SimplifiedThemeConfig | null | undefined): ThemeConfig {
  if (!simplified) return DEFAULT_THEME;
  return {
    colors: {
      ...DEFAULT_THEME.colors,
      ...simplified.colors,
    },
    fonts: {
      ...DEFAULT_THEME.fonts,
      ...simplified.fonts,
    },
    radius: simplified.radius ?? DEFAULT_THEME.radius,
    fontScale: simplified.fontScale ?? DEFAULT_THEME.fontScale,
  };
}

export function fullToSimplifiedTheme(full: ThemeConfig | null | undefined): SimplifiedThemeConfig {
  if (!full) return {};
  return {
    colors: { ...full.colors },
    fonts: { ...full.fonts },
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

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length >= 2 && slug.length <= 80;
}

export function jsonToTheme(theme: Json | null | undefined): ThemeConfig {
  if (!theme || typeof theme !== "object" || Array.isArray(theme)) {
    return DEFAULT_THEME;
  }
  const obj = theme as Record<string, unknown>;
  const colorsIn = (obj.colors ?? {}) as Record<string, unknown>;
  const fontsIn = (obj.fonts ?? {}) as Record<string, unknown>;
  const colors: ThemeColors = {
    bg: typeof colorsIn.bg === "string" ? colorsIn.bg : DEFAULT_THEME.colors.bg,
    surface: typeof colorsIn.surface === "string" ? colorsIn.surface : DEFAULT_THEME.colors.surface,
    surfaceAlt:
      typeof colorsIn.surfaceAlt === "string"
        ? colorsIn.surfaceAlt
        : DEFAULT_THEME.colors.surfaceAlt,
    border: typeof colorsIn.border === "string" ? colorsIn.border : DEFAULT_THEME.colors.border,
    text: typeof colorsIn.text === "string" ? colorsIn.text : DEFAULT_THEME.colors.text,
    heading: typeof colorsIn.heading === "string" ? colorsIn.heading : DEFAULT_THEME.colors.heading,
    muted: typeof colorsIn.muted === "string" ? colorsIn.muted : DEFAULT_THEME.colors.muted,
    primary: typeof colorsIn.primary === "string" ? colorsIn.primary : DEFAULT_THEME.colors.primary,
    primaryHover:
      typeof colorsIn.primaryHover === "string"
        ? colorsIn.primaryHover
        : DEFAULT_THEME.colors.primaryHover,
    primaryFg:
      typeof colorsIn.primaryFg === "string" ? colorsIn.primaryFg : DEFAULT_THEME.colors.primaryFg,
    accent: typeof colorsIn.accent === "string" ? colorsIn.accent : DEFAULT_THEME.colors.accent,
  };
  const fonts: ThemeFonts = {
    heading: typeof fontsIn.heading === "string" ? fontsIn.heading : DEFAULT_THEME.fonts.heading,
    body: typeof fontsIn.body === "string" ? fontsIn.body : DEFAULT_THEME.fonts.body,
    rich: typeof fontsIn.rich === "string" ? fontsIn.rich : DEFAULT_THEME.fonts.rich,
  };
  const radius = typeof obj.radius === "string" ? obj.radius : DEFAULT_THEME.radius;
  const fontScale =
    typeof obj.fontScale === "number" && isFinite(obj.fontScale)
      ? obj.fontScale
      : DEFAULT_THEME.fontScale;
  return { colors, fonts, radius, fontScale };
}

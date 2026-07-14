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
    text: "#e7e5e4",
    heading: "#f5f5f4",
    muted: "#a8a29e",
    primary: "#c2410c",
    primaryHover: "#9a3412",
    primaryFg: "#ffffff",
    accent: "#ea580c",
  },
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'Lora', serif",
    rich: "'EB Garamond', serif",
  },
  radius: "0.25rem",
  fontScale: 1,
};

export interface ThemePreset {
  name: string;
  label: string;
  theme: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "default",
    label: "Classic Gold",
    theme: DEFAULT_THEME,
  },
  {
    name: "rusty",
    label: "Rusty Dark",
    theme: RUSTY_THEME,
  },
  {
    name: "blush",
    label: "Blush Rose",
    theme: {
      colors: {
        bg: "#fdf2f8",
        surface: "#ffffff",
        surfaceAlt: "rgba(255,255,255,0.08)",
        border: "#fbcfe8",
        text: "#831843",
        heading: "#831843",
        muted: "#9d174d",
        primary: "#db2777",
        primaryHover: "#be185d",
        primaryFg: "#ffffff",
        accent: "#ec4899",
      },
      fonts: {
        heading: "'Playfair Display', serif",
        body: "'Lora', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.5rem",
      fontScale: 1,
    },
  },
  {
    name: "sage",
    label: "Sage Garden",
    theme: {
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
      fonts: {
        heading: "'Cormorant Garamond', serif",
        body: "'Cardo', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.5rem",
      fontScale: 1,
    },
  },
  {
    name: "navy",
    label: "Midnight Navy",
    theme: {
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
      fonts: {
        heading: "'Bodoni Moda', serif",
        body: "'Montserrat', sans-serif",
        rich: "'Cardo', serif",
      },
      radius: "0.25rem",
      fontScale: 1,
    },
  },
  {
    name: "lavender",
    label: "Lavender Mist",
    theme: {
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
      fonts: {
        heading: "'Great Vibes', cursive",
        body: "'Lora', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.5rem",
      fontScale: 1,
    },
  },
  {
    name: "terracotta",
    label: "Terracotta",
    theme: {
      colors: {
        bg: "#fef3c7",
        surface: "#fffbeb",
        surfaceAlt: "rgba(255,255,255,0.08)",
        border: "#fcd34d",
        text: "#7c2d12",
        heading: "#7c2d12",
        muted: "#9a3412",
        primary: "#c2410c",
        primaryHover: "#9a3412",
        primaryFg: "#ffffff",
        accent: "#ea580c",
      },
      fonts: {
        heading: "'Cormorant Garamond', serif",
        body: "'Cardo', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.25rem",
      fontScale: 1,
    },
  },
  {
    name: "ocean",
    label: "Ocean Breeze",
    theme: {
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
      fonts: {
        heading: "'Montserrat', sans-serif",
        body: "'Lora', serif",
        rich: "'Cardo', serif",
      },
      radius: "0.5rem",
      fontScale: 1,
    },
  },
  {
    name: "ivory",
    label: "Ivory & Black",
    theme: {
      colors: {
        bg: "#fafaf9",
        surface: "#ffffff",
        surfaceAlt: "rgba(0,0,0,0.03)",
        border: "#e7e5e4",
        text: "#1c1917",
        heading: "#0a0a0a",
        muted: "#57534e",
        primary: "#1c1917",
        primaryHover: "#0a0a0a",
        primaryFg: "#ffffff",
        accent: "#44403c",
      },
      fonts: {
        heading: "'Bodoni Moda', serif",
        body: "'Montserrat', sans-serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.125rem",
      fontScale: 1,
    },
  },
  {
    name: "coral",
    label: "Coral Sunset",
    theme: {
      colors: {
        bg: "#fff7ed",
        surface: "#ffffff",
        surfaceAlt: "rgba(255,255,255,0.08)",
        border: "#fed7aa",
        text: "#7c2d12",
        heading: "#7c2d12",
        muted: "#9a3412",
        primary: "#f97316",
        primaryHover: "#ea580c",
        primaryFg: "#ffffff",
        accent: "#fb923c",
      },
      fonts: {
        heading: "'Dancing Script', cursive",
        body: "'Lora', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.75rem",
      fontScale: 1,
    },
  },
  {
    name: "forest",
    label: "Deep Forest",
    theme: {
      colors: {
        bg: "#052e16",
        surface: "#14532d",
        surfaceAlt: "rgba(255,255,255,0.05)",
        border: "#166534",
        text: "#dcfce7",
        heading: "#f0fdf4",
        muted: "#bbf7d0",
        primary: "#4ade80",
        primaryHover: "#22c55e",
        primaryFg: "#052e16",
        accent: "#86efac",
      },
      fonts: {
        heading: "'Cormorant Garamond', serif",
        body: "'Cardo', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.25rem",
      fontScale: 1,
    },
  },
];

export interface FontOption {
  value: string;
  label: string;
}

export const RICH_FONT_OPTIONS: FontOption[] = [
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'EB Garamond', serif", label: "EB Garamond" },
  { value: "'Cormorant Garamond', serif", label: "Cormorant Garamond" },
  { value: "'Lora', serif", label: "Lora" },
  { value: "'Cardo', serif", label: "Cardo" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Bodoni Moda', serif", label: "Bodoni Moda" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Dancing Script', cursive", label: "Dancing Script" },
  { value: "'Great Vibes', cursive", label: "Great Vibes" },
  { value: "'Caveat', cursive", label: "Caveat" },
];

export const HEADING_FONT_OPTIONS: FontOption[] = [
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Cormorant Garamond', serif", label: "Cormorant Garamond" },
  { value: "'Bodoni Moda', serif", label: "Bodoni Moda" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Dancing Script', cursive", label: "Dancing Script" },
  { value: "'Great Vibes', cursive", label: "Great Vibes" },
  { value: "'Caveat', cursive", label: "Caveat" },
  { value: "'EB Garamond', serif", label: "EB Garamond" },
  { value: "'Lora', serif", label: "Lora" },
  { value: "'Cardo', serif", label: "Cardo" },
];

export function simplifiedToFullTheme(simplified: SimplifiedThemeConfig | null | undefined): ThemeConfig {
  const base = DEFAULT_THEME;
  if (!simplified) return base;
  return {
    colors: {
      bg: simplified.bg ?? base.colors.bg,
      surface: simplified.surface ?? base.colors.surface,
      surfaceAlt: base.colors.surfaceAlt,
      border: simplified.border ?? base.colors.border,
      text: simplified.text ?? base.colors.text,
      heading: simplified.heading ?? base.colors.heading,
      muted: simplified.muted ?? base.colors.muted,
      primary: simplified.primary ?? base.colors.primary,
      primaryHover: simplified.primaryHover ?? base.colors.primaryHover,
      primaryFg: base.colors.primaryFg,
      accent: simplified.accent ?? base.colors.accent,
    },
    fonts: {
      heading: simplified.fontHeading ?? base.fonts.heading,
      body: simplified.fontBody ?? base.fonts.body,
      rich: simplified.fontRich ?? base.fonts.rich,
    },
    radius: simplified.radius ?? base.radius,
    fontScale: simplified.fontScale ?? base.fontScale,
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
    accent: full.colors.accent,
    fontHeading: full.fonts.heading,
    fontBody: full.fonts.body,
    fontRich: full.fonts.rich,
    radius: full.radius,
    fontScale: full.fontScale,
  };
}

export function themeToEventCssVars(theme: ThemeConfig): React.CSSProperties {
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
  } as React.CSSProperties;
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
  if (!slug) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length >= 2 && slug.length <= 80;
}

export function jsonToTheme(theme: Json | null | undefined): ThemeConfig {
  if (!theme || typeof theme !== "object" || Array.isArray(theme)) {
    return DEFAULT_THEME;
  }
  const obj = theme as Record<string, unknown>;
  const colorsSrc = (obj.colors ?? {}) as Record<string, unknown>;
  const fontsSrc = (obj.fonts ?? {}) as Record<string, unknown>;
  const base = DEFAULT_THEME;
  return {
    colors: {
      bg: (colorsSrc.bg as string) ?? base.colors.bg,
      surface: (colorsSrc.surface as string) ?? base.colors.surface,
      surfaceAlt: (colorsSrc.surfaceAlt as string) ?? base.colors.surfaceAlt,
      border: (colorsSrc.border as string) ?? base.colors.border,
      text: (colorsSrc.text as string) ?? base.colors.text,
      heading: (colorsSrc.heading as string) ?? base.colors.heading,
      muted: (colorsSrc.muted as string) ?? base.colors.muted,
      primary: (colorsSrc.primary as string) ?? base.colors.primary,
      primaryHover: (colorsSrc.primaryHover as string) ?? base.colors.primaryHover,
      primaryFg: (colorsSrc.primaryFg as string) ?? base.colors.primaryFg,
      accent: (colorsSrc.accent as string) ?? base.colors.accent,
    },
    fonts: {
      heading: (fontsSrc.heading as string) ?? base.fonts.heading,
      body: (fontsSrc.body as string) ?? base.fonts.body,
      rich: (fontsSrc.rich as string) ?? base.fonts.rich,
    },
    radius: (obj.radius as string) ?? base.radius,
    fontScale: (obj.fontScale as number) ?? base.fontScale,
  };
}

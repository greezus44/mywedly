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
    bg: "#1c1410",
    surface: "#2a1f18",
    surfaceAlt: "rgba(255,255,255,0.06)",
    border: "#3d2e22",
    text: "#e8d5c4",
    heading: "#f5e6d3",
    muted: "#b8a48c",
    primary: "#c97b4a",
    primaryHover: "#b06a3c",
    primaryFg: "#1c1410",
    accent: "#e09a5e",
  },
  fonts: {
    heading: "Georgia, serif",
    body: "Georgia, serif",
    rich: "Georgia, serif",
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
      surfaceAlt: "rgba(255,255,255,0.6)",
      border: "#fbcfe8",
      text: "#831843",
      heading: "#831843",
      muted: "#be185d",
      primary: "#db2777",
      primaryHover: "#be185d",
      primaryFg: "#ffffff",
      accent: "#ec4899",
    },
    fonts: { heading: "Georgia, serif", body: "Georgia, serif", rich: "Georgia, serif" },
    radius: "0.75rem",
    fontScale: 1,
  },
  sage: {
    colors: {
      bg: "#f0fdf4",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.6)",
      border: "#bbf7d0",
      text: "#14532d",
      heading: "#14532d",
      muted: "#16a34a",
      primary: "#16a34a",
      primaryHover: "#15803d",
      primaryFg: "#ffffff",
      accent: "#22c55e",
    },
    fonts: { heading: "Georgia, serif", body: "Georgia, serif", rich: "Georgia, serif" },
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
    fonts: { heading: "Georgia, serif", body: "Georgia, serif", rich: "Georgia, serif" },
    radius: "0.5rem",
    fontScale: 1,
  },
  ivory: {
    colors: {
      bg: "#fafaf9",
      surface: "#ffffff",
      surfaceAlt: "rgba(0,0,0,0.03)",
      border: "#e7e5e4",
      text: "#1c1917",
      heading: "#1c1917",
      muted: "#78716c",
      primary: "#1c1917",
      primaryHover: "#292524",
      primaryFg: "#fafaf9",
      accent: "#57534e",
    },
    fonts: { heading: "Georgia, serif", body: "Georgia, serif", rich: "Georgia, serif" },
    radius: "0.25rem",
    fontScale: 1,
  },
  ocean: {
    colors: {
      bg: "#f0f9ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.6)",
      border: "#bae6fd",
      text: "#0c4a6e",
      heading: "#0c4a6e",
      muted: "#0369a1",
      primary: "#0ea5e9",
      primaryHover: "#0284c7)",
      primaryFg: "#ffffff",
      accent: "#38bdf8",
    },
    fonts: { heading: "Georgia, serif", body: "Georgia, serif", rich: "Georgia, serif" },
    radius: "0.5rem",
    fontScale: 1,
  },
  lavender: {
    colors: {
      bg: "#faf5ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.6)",
      border: "#e9d5ff",
      text: "#581c87",
      heading: "#581c87",
      muted: "#7e22ce",
      primary: "#9333ea",
      primaryHover: "#7e22ce",
      primaryFg: "#ffffff",
      accent: "#a855f7",
    },
    fonts: { heading: "Georgia, serif", body: "Georgia, serif", rich: "Georgia, serif" },
    radius: "0.5rem",
    fontScale: 1,
  },
  forest: {
    colors: {
      bg: "#0a1f12",
      surface: "#13291b",
      surfaceAlt: "rgba(255,255,255,0.05)",
      border: "#1e3a26",
      text: "#d4e8d4",
      heading: "#e8f5e9",
      muted: "#a5c9a5",
      primary: "#4ade80",
      primaryHover: "#22c55e",
      primaryFg: "#0a1f12",
      accent: "#86efac",
    },
    fonts: { heading: "Georgia, serif", body: "Georgia, serif", rich: "Georgia, serif" },
    radius: "0.5rem",
    fontScale: 1,
  },
  coral: {
    colors: {
      bg: "#fff7ed",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.6)",
      border: "#fed7aa",
      text: "#7c2d12",
      heading: "#7c2d12",
      muted: "#c2410c",
      primary: "#f97316",
      primaryHover: "#ea580c",
      primaryFg: "#ffffff",
      accent: "#fb923c",
    },
    fonts: { heading: "Georgia, serif", body: "Georgia, serif", rich: "Georgia, serif" },
    radius: "0.75rem",
    fontScale: 1,
  },
};

export const RICH_FONT_OPTIONS = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Merriweather (serif)", value: "Merriweather, Georgia, serif" },
  { label: "Playfair Display (serif)", value: "'Playfair Display', Georgia, serif" },
  { label: "Lora (serif)", value: "Lora, Georgia, serif" },
  { label: "Inter (sans)", value: "Inter, system-ui, sans-serif" },
  { label: "System Sans", value: "system-ui, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier (mono)", value: "'Courier New', monospace" },
  { label: "Roboto (sans)", value: "Roboto, system-ui, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', system-ui, sans-serif" },
  { label: "Montserrat", value: "Montserrat, system-ui, sans-serif" },
];

export const HEADING_FONT_OPTIONS = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Merriweather (serif)", value: "Merriweather, Georgia, serif" },
  { label: "Playfair Display (serif)", value: "'Playfair Display', Georgia, serif" },
  { label: "Lora (serif)", value: "Lora, Georgia, serif" },
  { label: "Inter (sans)", value: "Inter, system-ui, sans-serif" },
  { label: "System Sans", value: "system-ui, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier (mono)", value: "'Courier New', monospace" },
  { label: "Roboto (sans)", value: "Roboto, system-ui, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', system-ui, sans-serif" },
  { label: "Montserrat", value: "Montserrat, system-ui, sans-serif" },
];

export function simplifiedToFullTheme(simplified: SimplifiedThemeConfig | null | undefined): ThemeConfig {
  if (!simplified) return { ...DEFAULT_THEME };
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
    headingFont: theme.fonts.heading,
    bodyFont: theme.fonts.body,
    richFont: theme.fonts.rich,
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

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return { ...DEFAULT_THEME };
  }
  const obj = json as Record<string, unknown>;
  const colorsSrc = (obj.colors as Record<string, unknown> | undefined) ?? {};
  const fontsSrc = (obj.fonts as Record<string, unknown> | undefined) ?? {};
  const theme: ThemeConfig = {
    colors: {
      bg: (colorsSrc.bg as string) ?? DEFAULT_THEME.colors.bg,
      surface: (colorsSrc.surface as string) ?? DEFAULT_THEME.colors.surface,
      surfaceAlt: (colorsSrc.surfaceAlt as string) ?? DEFAULT_THEME.colors.surfaceAlt,
      border: (colorsSrc.border as string) ?? DEFAULT_THEME.colors.border,
      text: (colorsSrc.text as string) ?? DEFAULT_THEME.colors.text,
      heading: (colorsSrc.heading as string) ?? DEFAULT_THEME.colors.heading,
      muted: (colorsSrc.muted as string) ?? DEFAULT_THEME.colors.muted,
      primary: (colorsSrc.primary as string) ?? DEFAULT_THEME.colors.primary,
      primaryHover: (colorsSrc.primaryHover as string) ?? DEFAULT_THEME.colors.primaryHover,
      primaryFg: (colorsSrc.primaryFg as string) ?? DEFAULT_THEME.colors.primaryFg,
      accent: (colorsSrc.accent as string) ?? DEFAULT_THEME.colors.accent,
    },
    fonts: {
      heading: (fontsSrc.heading as string) ?? DEFAULT_THEME.fonts.heading,
      body: (fontsSrc.body as string) ?? DEFAULT_THEME.fonts.body,
      rich: (fontsSrc.rich as string) ?? DEFAULT_THEME.fonts.rich,
    },
    radius: (obj.radius as string) ?? DEFAULT_THEME.radius,
    fontScale: typeof obj.fontScale === "number" ? obj.fontScale : DEFAULT_THEME.fontScale,
  };
  return theme;
}

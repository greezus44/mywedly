import type { Json } from "./supabase";

export interface ThemeConfig {
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
  fontHeading: string;
  fontBody: string;
  fontRich: string;
  radius: string;
  fontScale: number;
}

export interface SimplifiedThemeConfig {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  headingFont: string;
  bodyFont: string;
  radius: string;
}

export const DEFAULT_THEME: ThemeConfig = {
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
  fontHeading: "Georgia, serif",
  fontBody: "Georgia, serif",
  fontRich: "Georgia, serif",
  radius: "0.5rem",
  fontScale: 1,
};

export const RUSTY_THEME: ThemeConfig = {
  bg: "#1a1410",
  surface: "#2a1f18",
  surfaceAlt: "rgba(255,255,255,0.05)",
  border: "#5a3a20",
  text: "#e8d5c0",
  heading: "#f5e6d3",
  muted: "#c0a080",
  primary: "#d97706",
  primaryHover: "#b45309",
  primaryFg: "#ffffff",
  accent: "#f59e0b",
  fontHeading: "'Playfair Display', serif",
  fontBody: "'Lora', serif",
  fontRich: "'Lora', serif",
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
    label: "Warm Amber",
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
      fontHeading: "'Playfair Display', serif",
      fontBody: "'Lora', serif",
      fontRich: "'Lora', serif",
      radius: "0.5rem",
      fontScale: 1,
    },
  },
  {
    name: "sage",
    label: "Sage Garden",
    theme: {
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
      fontHeading: "'Cormorant Garamond', serif",
      fontBody: "'EB Garamond', serif",
      fontRich: "'EB Garamond', serif",
      radius: "0.375rem",
      fontScale: 1,
    },
  },
  {
    name: "navy",
    label: "Midnight Navy",
    theme: {
      bg: "#0f172a",
      surface: "#1e293b",
      surfaceAlt: "rgba(255,255,255,0.05)",
      border: "#334155",
      text: "#cbd5e1",
      heading: "#f1f5f9",
      muted: "#94a3b8",
      primary: "#3b82f6",
      primaryHover: "#2563eb",
      primaryFg: "#ffffff",
      accent: "#60a5fa",
      fontHeading: "'Montserrat', sans-serif",
      fontBody: "'Montserrat', sans-serif",
      fontRich: "'Cardo', serif",
      radius: "0.25rem",
      fontScale: 1,
    },
  },
  {
    name: "lavender",
    label: "Lavender Dream",
    theme: {
      bg: "#faf5ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#ddd6fe",
      text: "#581c87",
      heading: "#6b21a8",
      muted: "#7e22ce",
      primary: "#9333ea",
      primaryHover: "#7e22ce",
      primaryFg: "#ffffff",
      accent: "#a855f7",
      fontHeading: "'Playfair Display', serif",
      fontBody: "'Cormorant Garamond', serif",
      fontRich: "'Cormorant Garamond', serif",
      radius: "0.5rem",
      fontScale: 1,
    },
  },
  {
    name: "terracotta",
    label: "Terracotta",
    theme: {
      bg: "#fef3e2",
      surface: "#fffaf5",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#fed7aa",
      text: "#7c2d12",
      heading: "#9a3412",
      muted: "#c2410c",
      primary: "#ea580c",
      primaryHover: "#c2410c",
      primaryFg: "#ffffff",
      accent: "#f97316",
      fontHeading: "'Bodoni Moda', serif",
      fontBody: "'Lora', serif",
      fontRich: "'Lora', serif",
      radius: "0.25rem",
      fontScale: 1,
    },
  },
  {
    name: "ivory",
    label: "Ivory Classic",
    theme: {
      bg: "#fffef9",
      surface: "#ffffff",
      surfaceAlt: "rgba(0,0,0,0.02)",
      border: "#e7e5e4",
      text: "#44403c",
      heading: "#292524",
      muted: "#78716c",
      primary: "#78716c",
      primaryHover: "#57534e",
      primaryFg: "#ffffff",
      accent: "#a8a29e",
      fontHeading: "'EB Garamond', serif",
      fontBody: "'EB Garamond', serif",
      fontRich: "'EB Garamond', serif",
      radius: "0.125rem",
      fontScale: 1,
    },
  },
  {
    name: "ocean",
    label: "Ocean Breeze",
    theme: {
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
      fontHeading: "'Montserrat', sans-serif",
      fontBody: "'Lora', serif",
      fontRich: "'Lora', serif",
      radius: "0.375rem",
      fontScale: 1,
    },
  },
  {
    name: "burgundy",
    label: "Burgundy Wine",
    theme: {
      bg: "#fef2f2",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: "#fecaca",
      text: "#7f1d1d",
      heading: "#991b1b",
      muted: "#b91c1c",
      primary: "#dc2626",
      primaryHover: "#b91c1c",
      primaryFg: "#ffffff",
      accent: "#ef4444",
      fontHeading: "'Playfair Display', serif",
      fontBody: "'Lora', serif",
      fontRich: "'Lora', serif",
      radius: "0.25rem",
      fontScale: 1,
    },
  },
  {
    name: "forest",
    label: "Deep Forest",
    theme: {
      bg: "#1a2e1a",
      surface: "#243824",
      surfaceAlt: "rgba(255,255,255,0.05)",
      border: "#3a5a3a",
      text: "#d4e8d4",
      heading: "#e8f5e8",
      muted: "#a0c0a0",
      primary: "#65a30d",
      primaryHover: "#4d7c0f",
      primaryFg: "#ffffff",
      accent: "#84cc16",
      fontHeading: "'Cormorant Garamond', serif",
      fontBody: "'EB Garamond', serif",
      fontRich: "'EB Garamond', serif",
      radius: "0.375rem",
      fontScale: 1,
    },
  },
];

export interface FontOption {
  value: string;
  label: string;
  category: string;
}

export const RICH_FONT_OPTIONS: FontOption[] = [
  { value: "Georgia, serif", label: "Georgia", category: "Serif" },
  { value: "'Playfair Display', serif", label: "Playfair Display", category: "Serif" },
  { value: "'Cormorant Garamond', serif", label: "Cormorant Garamond", category: "Serif" },
  { value: "'Lora', serif", label: "Lora", category: "Serif" },
  { value: "'EB Garamond', serif", label: "EB Garamond", category: "Serif" },
  { value: "'Cardo', serif", label: "Cardo", category: "Serif" },
  { value: "'Bodoni Moda', serif", label: "Bodoni Moda", category: "Serif" },
  { value: "'Montserrat', sans-serif", label: "Montserrat", category: "Sans" },
  { value: "Inter, sans-serif", label: "Inter", category: "Sans" },
  { value: "'Dancing Script', cursive", label: "Dancing Script", category: "Script" },
  { value: "'Great Vibes', cursive", label: "Great Vibes", category: "Script" },
  { value: "'Caveat', cursive", label: "Caveat", category: "Script" },
];

export const HEADING_FONT_OPTIONS: FontOption[] = [
  { value: "Georgia, serif", label: "Georgia", category: "Serif" },
  { value: "'Playfair Display', serif", label: "Playfair Display", category: "Serif" },
  { value: "'Cormorant Garamond', serif", label: "Cormorant Garamond", category: "Serif" },
  { value: "'Lora', serif", label: "Lora", category: "Serif" },
  { value: "'EB Garamond', serif", label: "EB Garamond", category: "Serif" },
  { value: "'Cardo', serif", label: "Cardo", category: "Serif" },
  { value: "'Bodoni Moda', serif", label: "Bodoni Moda", category: "Serif" },
  { value: "'Montserrat', sans-serif", label: "Montserrat", category: "Sans" },
  { value: "Inter, sans-serif", label: "Inter", category: "Sans" },
  { value: "'Dancing Script', cursive", label: "Dancing Script", category: "Script" },
  { value: "'Great Vibes', cursive", label: "Great Vibes", category: "Script" },
  { value: "'Caveat', cursive", label: "Caveat", category: "Script" },
];

export function simplifiedToFullTheme(s: Partial<SimplifiedThemeConfig>): ThemeConfig {
  return {
    ...DEFAULT_THEME,
    primary: s.primary ?? DEFAULT_THEME.primary,
    primaryHover: s.primary ? shadeColor(s.primary, -15) : DEFAULT_THEME.primaryHover,
    accent: s.accent ?? DEFAULT_THEME.accent,
    bg: s.background ?? DEFAULT_THEME.bg,
    surface: s.surface ?? DEFAULT_THEME.surface,
    text: s.text ?? DEFAULT_THEME.text,
    heading: s.text ? shadeColor(s.text, -10) : DEFAULT_THEME.heading,
    fontHeading: s.headingFont ?? DEFAULT_THEME.fontHeading,
    fontBody: s.bodyFont ?? DEFAULT_THEME.fontBody,
    fontRich: s.bodyFont ?? DEFAULT_THEME.fontRich,
    radius: s.radius ?? DEFAULT_THEME.radius,
  };
}

export function fullToSimplifiedTheme(t: ThemeConfig): SimplifiedThemeConfig {
  return {
    primary: t.primary,
    accent: t.accent,
    background: t.bg,
    surface: t.surface,
    text: t.text,
    headingFont: t.fontHeading,
    bodyFont: t.fontBody,
    radius: t.radius,
  };
}

function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) return hex;
  const r = Math.max(0, Math.min(255, (num >> 16) + Math.round((num >> 16) * (percent / 100))));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + Math.round(((num >> 8) & 0xff) * (percent / 100))));
  const b = Math.max(0, Math.min(255, (num & 0xff) + Math.round((num & 0xff) * (percent / 100))));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function themeToEventCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--event-bg": theme.bg,
    "--event-surface": theme.surface,
    "--event-surface-alt": theme.surfaceAlt,
    "--event-border": theme.border,
    "--event-text": theme.text,
    "--event-heading": theme.heading,
    "--event-muted": theme.muted,
    "--event-primary": theme.primary,
    "--event-primary-hover": theme.primaryHover,
    "--event-primary-fg": theme.primaryFg,
    "--event-accent": theme.accent,
    "--event-font-heading": theme.fontHeading,
    "--event-font-body": theme.fontBody,
    "--event-font-rich": theme.fontRich,
    "--event-radius": theme.radius,
    "--event-font-scale": String(theme.fontScale ?? 1),
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
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 50;
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) return { ...DEFAULT_THEME };
  const obj = json as Record<string, unknown>;
  return {
    ...DEFAULT_THEME,
    ...Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
    ),
  } as ThemeConfig;
}

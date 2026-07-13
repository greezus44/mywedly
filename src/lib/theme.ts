import type { ThemeConfig } from "./supabase";

export const DEFAULT_THEME: ThemeConfig = {
  bg: "#faf7f2",
  surface: "#ffffff",
  border: "#e8e0d5",
  text: "#2d2424",
  muted: "#8a7a72",
  primary: "#b8860b",
  primaryHover: "#9a7209",
  primaryLight: "#f5e6c8",
  accent: "#d4a574",
  font: '"Cormorant Garamond", serif',
};

export const RUSTY_THEME: ThemeConfig = {
  bg: "#f5f0e8",
  surface: "#fffaf3",
  border: "#d4c4a8",
  text: "#3d2f1f",
  muted: "#8a7560",
  primary: "#8b6914",
  primaryHover: "#6e5410",
  primaryLight: "#f0e4c8",
  accent: "#c4a767",
  font: '"Playfair Display", serif',
};

export const THEME_PRESETS: { name: string; theme: ThemeConfig }[] = [
  { name: "Classic Gold", theme: DEFAULT_THEME },
  { name: "Rustic", theme: RUSTY_THEME },
  {
    name: "Modern Blue",
    theme: {
      bg: "#f0f4f8",
      surface: "#ffffff",
      border: "#c3d4e0",
      text: "#1a2e3f",
      muted: "#6b8299",
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      primaryLight: "#dbeafe",
      accent: "#60a5fa",
      font: '"Montserrat", sans-serif',
    },
  },
  {
    name: "Forest Green",
    theme: {
      bg: "#f0f5f0",
      surface: "#ffffff",
      border: "#c8d8c8",
      text: "#1a3a1a",
      muted: "#6b8a6b",
      primary: "#15803d",
      primaryHover: "#166534",
      primaryLight: "#dcfce7",
      accent: "#86efac",
      font: '"Lora", serif',
    },
  },
  {
    name: "Blush Pink",
    theme: {
      bg: "#fdf5f5",
      surface: "#ffffff",
      border: "#f0d4d4",
      text: "#3d1f1f",
      muted: "#a07070",
      primary: "#be185d",
      primaryHover: "#9f1239",
      primaryLight: "#fce7f3",
      accent: "#f9a8d4",
      font: '"EB Garamond", serif',
    },
  },
  {
    name: "Midnight",
    theme: {
      bg: "#1a1a2e",
      surface: "#252542",
      border: "#3d3d5c",
      text: "#e0e0f0",
      muted: "#9090b0",
      primary: "#c4a574",
      primaryHover: "#b08d5e",
      primaryLight: "#3d3d5c",
      accent: "#e8c89a",
      font: '"Cinzel", serif',
    },
  },
];

export const RICH_FONT_OPTIONS = [
  { value: '"Cormorant Garamond", serif', label: "Cormorant Garamond" },
  { value: '"Playfair Display", serif', label: "Playfair Display" },
  { value: '"Montserrat", sans-serif', label: "Montserrat" },
  { value: '"Lora", serif', label: "Lora" },
  { value: '"EB Garamond", serif', label: "EB Garamond" },
  { value: '"Cinzel", serif', label: "Cinzel" },
  { value: '"Great Vibes", cursive', label: "Great Vibes" },
  { value: '"Bebas Neue", sans-serif', label: "Bebas Neue" },
  { value: '"Inter", sans-serif', label: "Inter" },
];

export const FONT_SIZE_OPTIONS = [
  { value: "0.875rem", label: "Small" },
  { value: "1rem", label: "Medium" },
  { value: "1.125rem", label: "Large" },
  { value: "1.25rem", label: "Extra Large" },
];

export function themeToEventCssVars(theme: ThemeConfig | null | undefined): Record<string, string> {
  const t = theme || DEFAULT_THEME;
  return {
    "--event-bg": t.bg || DEFAULT_THEME.bg!,
    "--event-surface": t.surface || DEFAULT_THEME.surface!,
    "--event-border": t.border || DEFAULT_THEME.border!,
    "--event-text": t.text || DEFAULT_THEME.text!,
    "--event-muted": t.muted || DEFAULT_THEME.muted!,
    "--event-primary": t.primary || DEFAULT_THEME.primary!,
    "--event-primary-hover": t.primaryHover || DEFAULT_THEME.primaryHover!,
    "--event-primary-light": t.primaryLight || DEFAULT_THEME.primaryLight!,
    "--event-accent": t.accent || DEFAULT_THEME.accent!,
    "--event-font": t.font || DEFAULT_THEME.font!,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3;
}

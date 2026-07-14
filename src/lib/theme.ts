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
  buttonStyle: "rounded" | "soft" | "square";
  buttonSize: "sm" | "md" | "lg";
  bgType: "solid" | "gradient" | "image";
  bgGradient?: string;
  bgImage?: string;
  bgImagePosition?: string;
  bgOverlayOpacity?: number;
}

export interface SimplifiedThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  headingFont: string;
  bodyFont: string;
  fontScale: "sm" | "md" | "lg";
  buttonStyle: "rounded" | "soft" | "square";
  buttonSize: "sm" | "md" | "lg";
  cornerRadius: number;
  bgType: "solid" | "gradient" | "image";
  bgGradient?: string;
  bgImage?: string;
  bgImagePosition?: string;
  bgOverlayOpacity?: number;
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
  buttonStyle: "rounded",
  buttonSize: "md",
  bgType: "solid",
};

export const RUSTY_THEME: ThemeConfig = {
  ...DEFAULT_THEME,
  bg: "#2a1f1a",
  surface: "#3a2e28",
  surfaceAlt: "rgba(255,255,255,0.05)",
  border: "#5a4a40",
  text: "#e8d5c4",
  heading: "#f0dcc8",
  muted: "#c4a890",
  primary: "#d97706",
  primaryHover: "#b45309",
  primaryFg: "#ffffff",
  accent: "#f59e0b",
  radius: "0.25rem",
};

const fontScaleMap: Record<string, number> = {
  sm: 0.9,
  md: 1,
  lg: 1.1,
};

const radiusMap: Record<string, string> = {
  rounded: "0.5rem",
  soft: "0.25rem",
  square: "0px",
};

export function simplifiedToFullTheme(s: SimplifiedThemeConfig): ThemeConfig {
  const radius = radiusMap[s.buttonStyle] ?? "0.5rem";
  const baseRadius = `${s.cornerRadius / 16}rem`;
  return {
    bg: s.backgroundColor,
    surface: s.surfaceColor,
    surfaceAlt: "rgba(255,255,255,0.08)",
    border: s.secondaryColor,
    text: s.secondaryTextColor,
    heading: s.primaryTextColor,
    muted: s.secondaryTextColor,
    primary: s.primaryColor,
    primaryHover: s.primaryColor,
    primaryFg: "#ffffff",
    accent: s.secondaryColor,
    fontHeading: s.headingFont,
    fontBody: s.bodyFont,
    fontRich: s.bodyFont,
    radius: baseRadius || radius,
    fontScale: fontScaleMap[s.fontScale] ?? 1,
    buttonStyle: s.buttonStyle,
    buttonSize: s.buttonSize,
    bgType: s.bgType,
    bgGradient: s.bgGradient,
    bgImage: s.bgImage,
    bgImagePosition: s.bgImagePosition,
    bgOverlayOpacity: s.bgOverlayOpacity,
  };
}

export function fullToSimplifiedTheme(t: ThemeConfig): SimplifiedThemeConfig {
  const fontScaleInverse: Record<number, "sm" | "md" | "lg"> = {
    0.9: "sm",
    1: "md",
    1.1: "lg",
  };
  return {
    primaryColor: t.primary,
    secondaryColor: t.accent,
    backgroundColor: t.bg,
    surfaceColor: t.surface,
    primaryTextColor: t.heading,
    secondaryTextColor: t.text,
    headingFont: t.fontHeading,
    bodyFont: t.fontBody,
    fontScale: fontScaleInverse[t.fontScale] ?? "md",
    buttonStyle: t.buttonStyle,
    buttonSize: t.buttonSize,
    cornerRadius: parseFloat(t.radius) * 16 || 8,
    bgType: t.bgType,
    bgGradient: t.bgGradient,
    bgImage: t.bgImage,
    bgImagePosition: t.bgImagePosition,
    bgOverlayOpacity: t.bgOverlayOpacity,
  };
}

export interface ThemePreset {
  name: string;
  config: SimplifiedThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Minimal",
    config: {
      primaryColor: "#1a1a1a",
      secondaryColor: "#666666",
      backgroundColor: "#ffffff",
      surfaceColor: "#f9f9f9",
      primaryTextColor: "#1a1a1a",
      secondaryTextColor: "#666666",
      headingFont: "Helvetica, Arial, sans-serif",
      bodyFont: "Helvetica, Arial, sans-serif",
      fontScale: "md",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 0,
      bgType: "solid",
    },
  },
  {
    name: "Elegant",
    config: {
      primaryColor: "#8b7355",
      secondaryColor: "#c4a882",
      backgroundColor: "#faf8f5",
      surfaceColor: "#ffffff",
      primaryTextColor: "#3d3528",
      secondaryTextColor: "#6b5d4f",
      headingFont: "Georgia, serif",
      bodyFont: "Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 4,
      bgType: "solid",
    },
  },
  {
    name: "Classic",
    config: {
      primaryColor: "#1e3a5f",
      secondaryColor: "#c9a96e",
      backgroundColor: "#fdfbf7",
      surfaceColor: "#ffffff",
      primaryTextColor: "#1e3a5f",
      secondaryTextColor: "#4a5568",
      headingFont: "Times New Roman, serif",
      bodyFont: "Times New Roman, serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  {
    name: "Modern",
    config: {
      primaryColor: "#0ea5e9",
      secondaryColor: "#6366f1",
      backgroundColor: "#f8fafc",
      surfaceColor: "#ffffff",
      primaryTextColor: "#0f172a",
      secondaryTextColor: "#475569",
      headingFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 12,
      bgType: "solid",
    },
  },
  {
    name: "Romantic",
    config: {
      primaryColor: "#e11d48",
      secondaryColor: "#f9a8d4",
      backgroundColor: "#fff1f2",
      surfaceColor: "#ffffff",
      primaryTextColor: "#881337",
      secondaryTextColor: "#9f1239",
      headingFont: "Georgia, serif",
      bodyFont: "Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 6,
      bgType: "solid",
    },
  },
  {
    name: "Luxury",
    config: {
      primaryColor: "#d4af37",
      secondaryColor: "#2c2c2c",
      backgroundColor: "#1a1a1a",
      surfaceColor: "#2c2c2c",
      primaryTextColor: "#d4af37",
      secondaryTextColor: "#e5e5e5",
      headingFont: "Georgia, serif",
      bodyFont: "Helvetica, Arial, sans-serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 2,
      bgType: "solid",
    },
  },
  {
    name: "Botanical",
    config: {
      primaryColor: "#4a7c59",
      secondaryColor: "#8fb996",
      backgroundColor: "#f4f7f4",
      surfaceColor: "#ffffff",
      primaryTextColor: "#2d4a36",
      secondaryTextColor: "#5a7365",
      headingFont: "Georgia, serif",
      bodyFont: "Helvetica, Arial, sans-serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 6,
      bgType: "solid",
    },
  },
  {
    name: "Neutral",
    config: {
      primaryColor: "#78716c",
      secondaryColor: "#a8a29e",
      backgroundColor: "#fafaf9",
      surfaceColor: "#ffffff",
      primaryTextColor: "#292524",
      secondaryTextColor: "#57534e",
      headingFont: "Helvetica, Arial, sans-serif",
      bodyFont: "Helvetica, Arial, sans-serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 4,
      bgType: "solid",
    },
  },
  {
    name: "Dark",
    config: {
      primaryColor: "#f59e0b",
      secondaryColor: "#fbbf24",
      backgroundColor: "#18181b",
      surfaceColor: "#27272a",
      primaryTextColor: "#fafafa",
      secondaryTextColor: "#d4d4d8",
      headingFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  {
    name: "Editorial",
    config: {
      primaryColor: "#18181b",
      secondaryColor: "#71717a",
      backgroundColor: "#fafafa",
      surfaceColor: "#ffffff",
      primaryTextColor: "#18181b",
      secondaryTextColor: "#52525b",
      headingFont: "Georgia, serif",
      bodyFont: "Helvetica, Arial, sans-serif",
      fontScale: "lg",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 0,
      bgType: "solid",
    },
  },
];

export interface FontOption {
  label: string;
  value: string;
}

export const RICH_FONT_OPTIONS: FontOption[] = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Garamond", value: "'EB Garamond', Garamond, serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Lora", value: "Lora, Georgia, serif" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif" },
  { label: "Open Sans", value: "'Open Sans', Helvetica, sans-serif" },
  { label: "Montserrat", value: "Montserrat, Helvetica, sans-serif" },
  { label: "System", value: "system-ui, sans-serif" },
];

export const HEADING_FONT_OPTIONS: FontOption[] = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Garamond", value: "'EB Garamond', Garamond, serif" },
  { label: "Lora", value: "Lora, Georgia, serif" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif" },
  { label: "Open Sans", value: "'Open Sans', Helvetica, sans-serif" },
  { label: "Montserrat", value: "Montserrat, Helvetica, sans-serif" },
  { label: "System", value: "system-ui, sans-serif" },
];

export function themeToEventCssVars(theme: ThemeConfig): Record<string, string> {
  const vars: Record<string, string> = {
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
    "--event-font-scale": String(theme.fontScale),
  };
  if (theme.bgImage) vars["--event-bg-image"] = `url(${theme.bgImage})`;
  if (theme.bgImagePosition) vars["--event-bg-image-position"] = theme.bgImagePosition;
  return vars;
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
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  return themeToEventCssVars(theme);
}

export function themeToJson(theme: ThemeConfig): Json {
  return theme as unknown as Json;
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object") return DEFAULT_THEME;
  return { ...DEFAULT_THEME, ...(json as object) } as ThemeConfig;
}

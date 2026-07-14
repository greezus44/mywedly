import type { Json } from "./supabase";

export type ButtonStyle = "rounded" | "soft" | "square";
export type ButtonSize = "sm" | "md" | "lg";
export type FontScale = "sm" | "md" | "lg";
export type BgType = "solid" | "gradient" | "image";

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
  buttonStyle: ButtonStyle;
  buttonSize: ButtonSize;
  bgType: BgType;
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
  fontScale: FontScale;
  buttonStyle: ButtonStyle;
  buttonSize: ButtonSize;
  cornerRadius: number;
  bgType: BgType;
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
  surface: "#3d2e26",
  surfaceAlt: "rgba(255,255,255,0.06)",
  border: "#5c4033",
  text: "#e8d5c4",
  heading: "#f5e6d3",
  muted: "#b8a088",
  primary: "#c8853d",
  primaryHover: "#b07432",
  primaryFg: "#2a1f1a",
  accent: "#d4a056",
  fontHeading: "'Playfair Display', Georgia, serif",
  fontBody: "'EB Garamond', Georgia, serif",
  fontRich: "'EB Garamond', Georgia, serif",
  radius: "0.375rem",
  bgType: "solid",
};

const fontScaleMap: Record<FontScale, number> = { sm: 0.9, md: 1, lg: 1.1 };
const buttonRadiusMap: Record<ButtonStyle, string> = {
  rounded: "0.5rem",
  soft: "0.25rem",
  square: "0",
};
const buttonSizeMap: Record<ButtonSize, string> = {
  sm: "0.65rem 1.25rem",
  md: "0.75rem 2rem",
  lg: "0.9rem 2.5rem",
};

export function simplifiedToFullTheme(s: SimplifiedThemeConfig): ThemeConfig {
  return {
    bg: s.backgroundColor,
    surface: s.surfaceColor,
    surfaceAlt: "rgba(255,255,255,0.08)",
    border: s.secondaryColor,
    text: s.primaryTextColor,
    heading: s.primaryTextColor,
    muted: s.secondaryTextColor,
    primary: s.primaryColor,
    primaryHover: s.primaryColor,
    primaryFg: "#ffffff",
    accent: s.secondaryColor,
    fontHeading: s.headingFont,
    fontBody: s.bodyFont,
    fontRich: s.bodyFont,
    radius: `${s.cornerRadius}px`,
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
  const scaleNum = t.fontScale;
  let fontScale: FontScale = "md";
  if (scaleNum <= 0.95) fontScale = "sm";
  else if (scaleNum >= 1.05) fontScale = "lg";

  const radiusNum = parseFloat(t.radius) || 0;

  return {
    primaryColor: t.primary,
    secondaryColor: t.accent,
    backgroundColor: t.bg,
    surfaceColor: t.surface,
    primaryTextColor: t.text,
    secondaryTextColor: t.muted,
    headingFont: t.fontHeading,
    bodyFont: t.fontBody,
    fontScale,
    buttonStyle: t.buttonStyle,
    buttonSize: t.buttonSize,
    cornerRadius: radiusNum,
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
      secondaryColor: "#e5e5e5",
      backgroundColor: "#ffffff",
      surfaceColor: "#fafafa",
      primaryTextColor: "#1a1a1a",
      secondaryTextColor: "#737373",
      headingFont: "Inter, sans-serif",
      bodyFont: "Inter, sans-serif",
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
      primaryColor: "#9b6a43",
      secondaryColor: "#d4c4b0",
      backgroundColor: "#faf7f2",
      surfaceColor: "#ffffff",
      primaryTextColor: "#3d2e26",
      secondaryTextColor: "#8a7560",
      headingFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'Cormorant Garamond', Georgia, serif",
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
      backgroundColor: "#f8f6f0",
      surfaceColor: "#ffffff",
      primaryTextColor: "#1e3a5f",
      secondaryTextColor: "#6b7b8d",
      headingFont: "'EB Garamond', Georgia, serif",
      bodyFont: "'Lora', Georgia, serif",
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
      primaryColor: "#6366f1",
      secondaryColor: "#e0e7ff",
      backgroundColor: "#f8fafc",
      surfaceColor: "#ffffff",
      primaryTextColor: "#0f172a",
      secondaryTextColor: "#64748b",
      headingFont: "'Montserrat', sans-serif",
      bodyFont: "'Inter', sans-serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 12,
      bgType: "solid",
    },
  },
  {
    name: "Romantic",
    config: {
      primaryColor: "#c44569",
      secondaryColor: "#f8b4c4",
      backgroundColor: "#fff5f7",
      surfaceColor: "#ffffff",
      primaryTextColor: "#5c2a3e",
      secondaryTextColor: "#a07080",
      headingFont: "'Dancing Script', cursive",
      bodyFont: "'Lora', Georgia, serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 16,
      bgType: "solid",
    },
  },
  {
    name: "Luxury",
    config: {
      primaryColor: "#b8860b",
      secondaryColor: "#1a1a1a",
      backgroundColor: "#0d0d0d",
      surfaceColor: "#1a1a1a",
      primaryTextColor: "#f5e6c8",
      secondaryTextColor: "#8a7a5c",
      headingFont: "'Bodoni Moda', serif",
      bodyFont: "'Cardo', serif",
      fontScale: "md",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 0,
      bgType: "solid",
    },
  },
  {
    name: "Botanical",
    config: {
      primaryColor: "#4a7c59",
      secondaryColor: "#c8d5bb",
      backgroundColor: "#f0f4ec",
      surfaceColor: "#ffffff",
      primaryTextColor: "#2d4a35",
      secondaryTextColor: "#6b8a72",
      headingFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Lora', Georgia, serif",
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
      primaryColor: "#8b7355",
      secondaryColor: "#d6c7b4",
      backgroundColor: "#f5f0ea",
      surfaceColor: "#ffffff",
      primaryTextColor: "#4a3f35",
      secondaryTextColor: "#9a8b78",
      headingFont: "'EB Garamond', Georgia, serif",
      bodyFont: "'EB Garamond', Georgia, serif",
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
      primaryColor: "#c8853d",
      secondaryColor: "#5c4033",
      backgroundColor: "#1a1410",
      surfaceColor: "#2a1f1a",
      primaryTextColor: "#e8d5c4",
      secondaryTextColor: "#b8a088",
      headingFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'EB Garamond', Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 6,
      bgType: "solid",
    },
  },
  {
    name: "Editorial",
    config: {
      primaryColor: "#2c2c2c",
      secondaryColor: "#a8a8a8",
      backgroundColor: "#faf8f5",
      surfaceColor: "#ffffff",
      primaryTextColor: "#1a1a1a",
      secondaryTextColor: "#666666",
      headingFont: "'Bodoni Moda', serif",
      bodyFont: "'Cardo', serif",
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
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "Cardo", value: "'Cardo', Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif" },
  { label: "Inter (sans)", value: "'Inter', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Caveat", value: "'Caveat', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
];

export const HEADING_FONT_OPTIONS: FontOption[] = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif" },
  { label: "Cardo", value: "'Cardo', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Caveat", value: "'Caveat', cursive" },
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
  if (theme.bgGradient) vars["--event-bg-gradient"] = theme.bgGradient;
  if (theme.bgImage) vars["--event-bg-image"] = theme.bgImage;
  if (theme.bgImagePosition) vars["--event-bg-image-position"] = theme.bgImagePosition;
  if (theme.bgOverlayOpacity !== undefined)
    vars["--event-bg-overlay-opacity"] = String(theme.bgOverlayOpacity);
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
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length > 0;
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return { ...DEFAULT_THEME };
  }
  const obj = json as Record<string, unknown>;
  return {
    ...DEFAULT_THEME,
    ...obj,
  } as unknown as ThemeConfig;
}

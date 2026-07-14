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
  bg: "#2a1a0e",
  surface: "#3a2418",
  surfaceAlt: "rgba(255,255,255,0.06)",
  border: "#5a3a20",
  text: "#f5e6d3",
  heading: "#f5e6d3",
  muted: "#c4a878",
  primary: "#c47830",
  primaryHover: "#a85f20",
  primaryFg: "#ffffff",
  accent: "#d97706",
  fontHeading: "Georgia, serif",
  fontBody: "Georgia, serif",
  fontRich: "Georgia, serif",
  radius: "0.375rem",
  fontScale: 1,
  buttonStyle: "soft",
  buttonSize: "md",
  bgType: "solid",
};

const fontScaleMap: Record<string, number> = {
  sm: 0.9,
  md: 1,
  lg: 1.1,
};

const radiusMap: Record<string, string> = {
  rounded: "0.5rem",
  soft: "0.25rem",
  square: "0rem",
};

const buttonSizeMap: Record<string, string> = {
  sm: "0.5rem 1.25rem",
  md: "0.75rem 2rem",
  lg: "1rem 2.5rem",
};

export function simplifiedToFullTheme(s: SimplifiedThemeConfig): ThemeConfig {
  const radius = String(s.cornerRadius ?? 8);
  const radiusRem = `${(parseFloat(radius) / 16).toFixed(3)}rem`;
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
    radius: radiusRem,
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
  let fontScale: "sm" | "md" | "lg" = "md";
  if (scaleNum <= 0.95) fontScale = "sm";
  else if (scaleNum >= 1.05) fontScale = "lg";

  const radiusPx = Math.round(parseFloat(t.radius) * 16);

  return {
    primaryColor: t.primary,
    secondaryColor: t.accent,
    backgroundColor: t.bg,
    surfaceColor: t.surface,
    primaryTextColor: t.heading,
    secondaryTextColor: t.text,
    headingFont: t.fontHeading,
    bodyFont: t.fontBody,
    fontScale,
    buttonStyle: t.buttonStyle,
    buttonSize: t.buttonSize,
    cornerRadius: radiusPx,
    bgType: t.bgType,
    bgGradient: t.bgGradient,
    bgImage: t.bgImage,
    bgImagePosition: t.bgImagePosition,
    bgOverlayOpacity: t.bgOverlayOpacity,
  };
}

export const RICH_FONT_OPTIONS = [
  { label: "Georgia (Serif)", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Palatino", value: "Palatino, serif" },
  { label: "Helvetica (Sans)", value: "Helvetica, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Courier (Mono)", value: "'Courier New', monospace" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Cursive", value: "cursive" },
];

export const HEADING_FONT_OPTIONS = [
  { label: "Georgia (Serif)", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Palatino", value: "Palatino, serif" },
  { label: "Helvetica (Sans)", value: "Helvetica, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Cursive", value: "cursive" },
  { label: "Courier (Mono)", value: "'Courier New', monospace" },
];

export const THEME_PRESETS: { name: string; config: SimplifiedThemeConfig }[] = [
  {
    name: "Minimal",
    config: {
      primaryColor: "#1a1a1a",
      secondaryColor: "#e5e5e5",
      backgroundColor: "#ffffff",
      surfaceColor: "#fafafa",
      primaryTextColor: "#1a1a1a",
      secondaryTextColor: "#525252",
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
      secondaryColor: "#d4c5b9",
      backgroundColor: "#faf8f5",
      surfaceColor: "#ffffff",
      primaryTextColor: "#3d3528",
      secondaryTextColor: "#6b5d4f",
      headingFont: "Garamond, serif",
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
      primaryColor: "#7c2d12",
      secondaryColor: "#fde68a",
      backgroundColor: "#fffbeb",
      surfaceColor: "#ffffff",
      primaryTextColor: "#78350f",
      secondaryTextColor: "#92400e",
      headingFont: "Georgia, serif",
      bodyFont: "Georgia, serif",
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
      secondaryColor: "#e0f2fe",
      backgroundColor: "#f8fafc",
      surfaceColor: "#ffffff",
      primaryTextColor: "#0f172a",
      secondaryTextColor: "#475569",
      headingFont: "Inter, sans-serif",
      bodyFont: "Inter, sans-serif",
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
      primaryColor: "#be185d",
      secondaryColor: "#fbcfe8",
      backgroundColor: "#fdf2f8",
      surfaceColor: "#ffffff",
      primaryTextColor: "#831843",
      secondaryTextColor: "#9d174d",
      headingFont: "Georgia, serif",
      bodyFont: "Palatino, serif",
      fontScale: "lg",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 6,
      bgType: "solid",
    },
  },
  {
    name: "Luxury",
    config: {
      primaryColor: "#a16207",
      secondaryColor: "#fef3c7",
      backgroundColor: "#1c1917",
      surfaceColor: "#292524",
      primaryTextColor: "#fef3c7",
      secondaryTextColor: "#d6d3d1",
      headingFont: "Garamond, serif",
      bodyFont: "Georgia, serif",
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
      primaryColor: "#15803d",
      secondaryColor: "#dcfce7",
      backgroundColor: "#f0fdf4",
      surfaceColor: "#ffffff",
      primaryTextColor: "#14532d",
      secondaryTextColor: "#166534",
      headingFont: "Palatino, serif",
      bodyFont: "Georgia, serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 10,
      bgType: "solid",
    },
  },
  {
    name: "Neutral",
    config: {
      primaryColor: "#78716c",
      secondaryColor: "#e7e5e4",
      backgroundColor: "#fafaf9",
      surfaceColor: "#ffffff",
      primaryTextColor: "#1c1917",
      secondaryTextColor: "#57534e",
      headingFont: "Helvetica, Arial, sans-serif",
      bodyFont: "Helvetica, Arial, sans-serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  {
    name: "Dark",
    config: {
      primaryColor: "#a78bfa",
      secondaryColor: "#312e81",
      backgroundColor: "#0f0c29",
      surfaceColor: "#1a1a2e",
      primaryTextColor: "#e2e8f0",
      secondaryTextColor: "#94a3b8",
      headingFont: "Inter, sans-serif",
      bodyFont: "Inter, sans-serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 10,
      bgType: "gradient",
      bgGradient: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    },
  },
  {
    name: "Editorial",
    config: {
      primaryColor: "#991b1b",
      secondaryColor: "#fee2e2",
      backgroundColor: "#fefefe",
      surfaceColor: "#fafafa",
      primaryTextColor: "#171717",
      secondaryTextColor: "#404040",
      headingFont: "'Times New Roman', serif",
      bodyFont: "Georgia, serif",
      fontScale: "lg",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 0,
      bgType: "solid",
    },
  },
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
  if (theme.bgType === "gradient" && theme.bgGradient) {
    vars["--event-bg"] = theme.bgGradient;
  }
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
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 80;
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return { ...DEFAULT_THEME };
  }
  const obj = json as Record<string, unknown>;
  return {
    ...DEFAULT_THEME,
    ...(obj as Partial<ThemeConfig>),
  };
}

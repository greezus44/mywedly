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
  bg: "#1a0f0a",
  surface: "#2a1a10",
  surfaceAlt: "rgba(255,255,255,0.05)",
  border: "#4a3020",
  text: "#e8d5c4",
  heading: "#f5e6d3",
  muted: "#c4a890",
  primary: "#c2410c",
  primaryHover: "#9a3412",
  primaryFg: "#fff8f0",
  accent: "#d97706",
  fontHeading: "Georgia, serif",
  fontBody: "Georgia, serif",
  fontRich: "Georgia, serif",
  radius: "0.25rem",
  fontScale: 1,
  buttonStyle: "square",
  buttonSize: "md",
  bgType: "solid",
};

export function simplifiedToFullTheme(s: SimplifiedThemeConfig): ThemeConfig {
  const fontScaleMap: Record<string, number> = { sm: 0.9, md: 1, lg: 1.1 };
  const radiusMap: Record<string, string> = {
    rounded: `${s.cornerRadius}px`,
    soft: `${s.cornerRadius * 1.5}px`,
    square: "0px",
  };
  return {
    bg: s.backgroundColor,
    surface: s.surfaceColor,
    surfaceAlt: `rgba(255,255,255,0.08)`,
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
    radius: radiusMap[s.buttonStyle] ?? `${s.cornerRadius}px`,
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
  const fontScaleReverse: Record<number, "sm" | "md" | "lg"> = {
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
    secondaryTextColor: t.muted,
    headingFont: t.fontHeading,
    bodyFont: t.fontBody,
    fontScale: fontScaleReverse[t.fontScale] ?? "md",
    buttonStyle: t.buttonStyle,
    buttonSize: t.buttonSize,
    cornerRadius: parseFloat(t.radius) || 8,
    bgType: t.bgType,
    bgGradient: t.bgGradient,
    bgImage: t.bgImage,
    bgImagePosition: t.bgImagePosition,
    bgOverlayOpacity: t.bgOverlayOpacity,
  };
}

export const RICH_FONT_OPTIONS: string[] = [
  "Georgia, serif",
  "'Times New Roman', serif",
  "Garamond, serif",
  "'Playfair Display', serif",
  "'Cormorant Garamond', serif",
  "'EB Garamond', serif",
  "Inter, sans-serif",
  "'Helvetica Neue', sans-serif",
  "Poppins, sans-serif",
  "'Montserrat', sans-serif",
  "'Lora', serif",
  "'Crimson Text', serif",
];

export const HEADING_FONT_OPTIONS: string[] = [
  "Georgia, serif",
  "'Times New Roman', serif",
  "Garamond, serif",
  "'Playfair Display', serif",
  "'Cormorant Garamond', serif",
  "'EB Garamond', serif",
  "Inter, sans-serif",
  "'Helvetica Neue', sans-serif",
  "Poppins, sans-serif",
  "'Montserrat', sans-serif",
  "'Lora', serif",
  "'Crimson Text', serif",
];

export const THEME_PRESETS: {
  id: string;
  name: string;
  config: SimplifiedThemeConfig;
}[] = [
  {
    id: "minimal",
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
    id: "elegant",
    name: "Elegant",
    config: {
      primaryColor: "#8b7355",
      secondaryColor: "#d4c4b0",
      backgroundColor: "#faf8f5",
      surfaceColor: "#ffffff",
      primaryTextColor: "#3d3528",
      secondaryTextColor: "#8b7355",
      headingFont: "'Playfair Display', serif",
      bodyFont: "Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 4,
      bgType: "solid",
    },
  },
  {
    id: "classic",
    name: "Classic",
    config: {
      primaryColor: "#b45309",
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
    id: "modern",
    name: "Modern",
    config: {
      primaryColor: "#0ea5e9",
      secondaryColor: "#e0f2fe",
      backgroundColor: "#f8fafc",
      surfaceColor: "#ffffff",
      primaryTextColor: "#0f172a",
      secondaryTextColor: "#64748b",
      headingFont: "Poppins, sans-serif",
      bodyFont: "Inter, sans-serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 12,
      bgType: "solid",
    },
  },
  {
    id: "romantic",
    name: "Romantic",
    config: {
      primaryColor: "#be185d",
      secondaryColor: "#fce7f3",
      backgroundColor: "#fff1f2",
      surfaceColor: "#ffffff",
      primaryTextColor: "#831843",
      secondaryTextColor: "#be185d",
      headingFont: "'Cormorant Garamond', serif",
      bodyFont: "Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 16,
      bgType: "solid",
    },
  },
  {
    id: "luxury",
    name: "Luxury",
    config: {
      primaryColor: "#a16207",
      secondaryColor: "#fef3c7",
      backgroundColor: "#1c1917",
      surfaceColor: "#292524",
      primaryTextColor: "#fef3c7",
      secondaryTextColor: "#d6d3d1",
      headingFont: "'Playfair Display', serif",
      bodyFont: "Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "lg",
      cornerRadius: 4,
      bgType: "solid",
    },
  },
  {
    id: "botanical",
    name: "Botanical",
    config: {
      primaryColor: "#15803d",
      secondaryColor: "#dcfce7",
      backgroundColor: "#f7fee7",
      surfaceColor: "#ffffff",
      primaryTextColor: "#14532d",
      secondaryTextColor: "#16a34a",
      headingFont: "'Lora', serif",
      bodyFont: "Georgia, serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  {
    id: "neutral",
    name: "Neutral",
    config: {
      primaryColor: "#78716c",
      secondaryColor: "#e7e5e4",
      backgroundColor: "#fafaf9",
      surfaceColor: "#ffffff",
      primaryTextColor: "#292524",
      secondaryTextColor: "#78716c",
      headingFont: "Inter, sans-serif",
      bodyFont: "Inter, sans-serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  {
    id: "dark",
    name: "Dark",
    config: {
      primaryColor: "#c2410c",
      secondaryColor: "#4a3020",
      backgroundColor: "#1a0f0a",
      surfaceColor: "#2a1a10",
      primaryTextColor: "#f5e6d3",
      secondaryTextColor: "#c4a890",
      headingFont: "Georgia, serif",
      bodyFont: "Georgia, serif",
      fontScale: "md",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 0,
      bgType: "solid",
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    config: {
      primaryColor: "#18181b",
      secondaryColor: "#a1a1aa",
      backgroundColor: "#ffffff",
      surfaceColor: "#f4f4f5",
      primaryTextColor: "#18181b",
      secondaryTextColor: "#71717a",
      headingFont: "'EB Garamond', serif",
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
  return vars;
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
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object") return DEFAULT_THEME;
  const obj = json as Record<string, unknown>;
  return {
    ...DEFAULT_THEME,
    ...obj,
  } as unknown as ThemeConfig;
}

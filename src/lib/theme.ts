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
  bg: "#faf7f2",
  surface: "#ffffff",
  surfaceAlt: "#f5f1ea",
  border: "#e8e2d8",
  text: "#3d3530",
  heading: "#2a2420",
  muted: "#8a8278",
  primary: "#b08968",
  primaryHover: "#9a7458",
  primaryFg: "#ffffff",
  accent: "#d4a373",
  fontHeading: "'Cormorant Garamond', serif",
  fontBody: "'Inter', sans-serif",
  fontRich: "'Inter', sans-serif",
  radius: "0.75rem",
  fontScale: 1,
  buttonStyle: "rounded",
  buttonSize: "md",
  bgType: "solid",
};

export const RUSTY_THEME: ThemeConfig = {
  bg: "#1a1410",
  surface: "#2a201a",
  surfaceAlt: "#332720",
  border: "#4a3a30",
  text: "#e8ddd0",
  heading: "#f5ede0",
  muted: "#a89888",
  primary: "#c47a4a",
  primaryHover: "#b06a3a",
  primaryFg: "#ffffff",
  accent: "#d49a6a",
  fontHeading: "'Cormorant Garamond', serif",
  fontBody: "'Inter', sans-serif",
  fontRich: "'Inter', sans-serif",
  radius: "0.5rem",
  fontScale: 1,
  buttonStyle: "soft",
  buttonSize: "md",
  bgType: "solid",
};

const FONT_SCALE_MAP: Record<string, number> = {
  sm: 0.9,
  md: 1,
  lg: 1.1,
};

const RADIUS_MAP: Record<string, string> = {
  "0": "0rem",
  "4": "0.25rem",
  "8": "0.5rem",
  "12": "0.75rem",
  "16": "1rem",
  "24": "1.5rem",
};

export function simplifiedToFullTheme(
  s: Partial<SimplifiedThemeConfig>
): ThemeConfig {
  const merged = { ...DEFAULT_THEME };
  if (s.primaryColor) {
    merged.primary = s.primaryColor;
    merged.primaryHover = s.primaryColor;
    merged.accent = s.primaryColor;
  }
  if (s.secondaryColor) {
    merged.accent = s.secondaryColor;
  }
  if (s.backgroundColor) {
    merged.bg = s.backgroundColor;
  }
  if (s.surfaceColor) {
    merged.surface = s.surfaceColor;
    merged.surfaceAlt = s.surfaceColor;
  }
  if (s.primaryTextColor) {
    merged.text = s.primaryTextColor;
    merged.heading = s.primaryTextColor;
  }
  if (s.secondaryTextColor) {
    merged.muted = s.secondaryTextColor;
  }
  if (s.headingFont) {
    merged.fontHeading = s.headingFont;
  }
  if (s.bodyFont) {
    merged.fontBody = s.bodyFont;
    merged.fontRich = s.bodyFont;
  }
  if (s.fontScale) {
    merged.fontScale = FONT_SCALE_MAP[s.fontScale] ?? 1;
  }
  if (s.buttonStyle) {
    merged.buttonStyle = s.buttonStyle;
  }
  if (s.buttonSize) {
    merged.buttonSize = s.buttonSize;
  }
  if (s.cornerRadius !== undefined) {
    merged.radius = RADIUS_MAP[String(s.cornerRadius)] ?? `${s.cornerRadius / 16}rem`;
  }
  if (s.bgType) {
    merged.bgType = s.bgType;
  }
  if (s.bgGradient) {
    merged.bgGradient = s.bgGradient;
  }
  if (s.bgImage) {
    merged.bgImage = s.bgImage;
  }
  if (s.bgImagePosition) {
    merged.bgImagePosition = s.bgImagePosition;
  }
  if (s.bgOverlayOpacity !== undefined) {
    merged.bgOverlayOpacity = s.bgOverlayOpacity;
  }
  return merged;
}

export function fullToSimplifiedTheme(
  t: ThemeConfig
): SimplifiedThemeConfig {
  const scaleEntries = Object.entries(FONT_SCALE_MAP);
  const closestScale =
    scaleEntries.reduce<{ key: string; diff: number } | null>(
      (acc, [key, val]) => {
        const diff = Math.abs(val - t.fontScale);
        if (!acc || diff < acc.diff) return { key, diff };
        return acc;
      },
      null
    )?.key ?? "md";

  return {
    primaryColor: t.primary,
    secondaryColor: t.accent,
    backgroundColor: t.bg,
    surfaceColor: t.surface,
    primaryTextColor: t.text,
    secondaryTextColor: t.muted,
    headingFont: t.fontHeading,
    bodyFont: t.fontBody,
    fontScale: closestScale as "sm" | "md" | "lg",
    buttonStyle: t.buttonStyle,
    buttonSize: t.buttonSize,
    cornerRadius: Math.round(parseFloat(t.radius) * 16),
    bgType: t.bgType,
    bgGradient: t.bgGradient,
    bgImage: t.bgImage,
    bgImagePosition: t.bgImagePosition,
    bgOverlayOpacity: t.bgOverlayOpacity,
  };
}

export const THEME_PRESETS: { name: string; config: SimplifiedThemeConfig }[] = [
  {
    name: "Minimal",
    config: {
      primaryColor: "#2a2420",
      secondaryColor: "#8a8278",
      backgroundColor: "#ffffff",
      surfaceColor: "#f9f9f9",
      primaryTextColor: "#1a1a1a",
      secondaryTextColor: "#7a7a7a",
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
      fontScale: "md",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 4,
      bgType: "solid",
    },
  },
  {
    name: "Elegant",
    config: {
      primaryColor: "#b08968",
      secondaryColor: "#d4a373",
      backgroundColor: "#faf7f2",
      surfaceColor: "#ffffff",
      primaryTextColor: "#3d3530",
      secondaryTextColor: "#8a8278",
      headingFont: "'Cormorant Garamond', serif",
      bodyFont: "'Inter', sans-serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 12,
      bgType: "solid",
    },
  },
  {
    name: "Classic",
    config: {
      primaryColor: "#5c4a3a",
      secondaryColor: "#a89888",
      backgroundColor: "#f5f1ea",
      surfaceColor: "#ffffff",
      primaryTextColor: "#3d3530",
      secondaryTextColor: "#7a6e60",
      headingFont: "'Playfair Display', serif",
      bodyFont: "'Lora', serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  {
    name: "Modern",
    config: {
      primaryColor: "#2563eb",
      secondaryColor: "#7c3aed",
      backgroundColor: "#f8fafc",
      surfaceColor: "#ffffff",
      primaryTextColor: "#1e293b",
      secondaryTextColor: "#64748b",
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
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
      secondaryColor: "#fb7185",
      backgroundColor: "#fff1f2",
      surfaceColor: "#ffffff",
      primaryTextColor: "#4c0519",
      secondaryTextColor: "#9f1239",
      headingFont: "'Cormorant Garamond', serif",
      bodyFont: "'Inter', sans-serif",
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
      primaryColor: "#c9a227",
      secondaryColor: "#1a1a1a",
      backgroundColor: "#0c0c0c",
      surfaceColor: "#1a1a1a",
      primaryTextColor: "#f5f5f5",
      secondaryTextColor: "#a3a3a3",
      headingFont: "'Playfair Display', serif",
      bodyFont: "'Inter', sans-serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "lg",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  {
    name: "Botanical",
    config: {
      primaryColor: "#4d7c0f",
      secondaryColor: "#84cc16",
      backgroundColor: "#f7fee7",
      surfaceColor: "#ffffff",
      primaryTextColor: "#365314",
      secondaryTextColor: "#65a30d",
      headingFont: "'Cormorant Garamond', serif",
      bodyFont: "'Inter', sans-serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 12,
      bgType: "solid",
    },
  },
  {
    name: "Neutral",
    config: {
      primaryColor: "#78716c",
      secondaryColor: "#a8a29e",
      backgroundColor: "#fafaf9",
      surfaceColor: "#f5f5f4",
      primaryTextColor: "#292524",
      secondaryTextColor: "#78716c",
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
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
      primaryColor: "#c47a4a",
      secondaryColor: "#d49a6a",
      backgroundColor: "#1a1410",
      surfaceColor: "#2a201a",
      primaryTextColor: "#e8ddd0",
      secondaryTextColor: "#a89888",
      headingFont: "'Cormorant Garamond', serif",
      bodyFont: "'Inter', sans-serif",
      fontScale: "md",
      buttonStyle: "soft",
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
      backgroundColor: "#ffffff",
      surfaceColor: "#f4f4f5",
      primaryTextColor: "#18181b",
      secondaryTextColor: "#71717a",
      headingFont: "'Playfair Display', serif",
      bodyFont: "'Inter', sans-serif",
      fontScale: "lg",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 0,
      bgType: "solid",
    },
  },
];

export const RICH_FONT_OPTIONS = [
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Crimson Text", value: "'Crimson Text', serif" },
  { label: "Source Serif Pro", value: "'Source Serif Pro', serif" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', serif" },
  { label: "Merriweather", value: "'Merriweather', serif" },
  { label: "Nunito", value: "'Nunito', sans-serif" },
  { label: "Karla", value: "'Karla', sans-serif" },
  { label: "Work Sans", value: "'Work Sans', sans-serif" },
];

export const HEADING_FONT_OPTIONS = [
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Crimson Text", value: "'Crimson Text', serif" },
  { label: "Source Serif Pro", value: "'Source Serif Pro', serif" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', serif" },
  { label: "Merriweather", value: "'Merriweather', serif" },
  { label: "Nunito", value: "'Nunito', sans-serif" },
  { label: "Karla", value: "'Karla', sans-serif" },
  { label: "Work Sans", value: "'Work Sans', sans-serif" },
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
  if (!json || typeof json !== "object") return { ...DEFAULT_THEME };
  const obj = json as Record<string, unknown>;
  return {
    ...DEFAULT_THEME,
    ...obj,
  } as unknown as ThemeConfig;
}

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
  bg: "#2a1f1a",
  surface: "#3d2e26",
  surfaceAlt: "rgba(255,255,255,0.06)",
  border: "#5c4238",
  text: "#e8d5c4",
  heading: "#f5e6d3",
  muted: "#c4a899",
  primary: "#c8794a",
  primaryHover: "#b5693e",
  primaryFg: "#ffffff",
  accent: "#e8a87c",
  fontHeading: "'Playfair Display', Georgia, serif",
  fontBody: "'Lora', Georgia, serif",
  fontRich: "'Lora', Georgia, serif",
  radius: "0.25rem",
  fontScale: 1,
  buttonStyle: "soft",
  buttonSize: "md",
  bgType: "gradient",
  bgGradient: "linear-gradient(135deg, #2a1f1a 0%, #3d2e26 100%)",
};

const FONT_SCALE_MAP: Record<"sm" | "md" | "lg", number> = {
  sm: 0.875,
  md: 1,
  lg: 1.125,
};

const RADIUS_MAP: Record<"rounded" | "soft" | "square", (r: number) => string> = {
  rounded: (r) => `${r}rem`,
  soft: (r) => `${Math.min(r, 0.375)}rem`,
  square: () => "0rem",
};

const BUTTON_SIZE_MAP: Record<"sm" | "md" | "lg", string> = {
  sm: "0.5rem 1rem",
  md: "0.625rem 1.5rem",
  lg: "0.75rem 2rem",
};

export function simplifiedToFullTheme(s: SimplifiedThemeConfig): ThemeConfig {
  const radius = RADIUS_MAP[s.buttonStyle](s.cornerRadius / 16);
  const fontScale = FONT_SCALE_MAP[s.fontScale];
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
    radius,
    fontScale,
    buttonStyle: s.buttonStyle,
    buttonSize: s.buttonSize,
    bgType: s.bgType,
    bgGradient: s.bgGradient,
    bgImage: s.bgImage,
    bgImagePosition: s.bgImagePosition ?? "center",
    bgOverlayOpacity: s.bgOverlayOpacity ?? 0.3,
  };
}

export function fullToSimplifiedTheme(t: ThemeConfig): SimplifiedThemeConfig {
  const fontScale: "sm" | "md" | "lg" =
    t.fontScale <= 0.9 ? "sm" : t.fontScale >= 1.1 ? "lg" : "md";
  const radiusMatch = t.radius.match(/([\d.]+)rem/);
  const cornerRadius = radiusMatch ? Math.round(parseFloat(radiusMatch[1]) * 16) : 8;
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
    cornerRadius,
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
      secondaryColor: "#6b7280",
      backgroundColor: "#ffffff",
      surfaceColor: "#f9fafb",
      primaryTextColor: "#111827",
      secondaryTextColor: "#6b7280",
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
    name: "Elegant",
    config: {
      primaryColor: "#9b6b3f",
      secondaryColor: "#c4a577",
      backgroundColor: "#faf7f2",
      surfaceColor: "#ffffff",
      primaryTextColor: "#3d2e1f",
      secondaryTextColor: "#8a7050",
      headingFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'Lora', Georgia, serif",
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
      backgroundColor: "#f5f5f0",
      surfaceColor: "#ffffff",
      primaryTextColor: "#1e3a5f",
      secondaryTextColor: "#5a6a7a",
      headingFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "Georgia, serif",
      fontScale: "md",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 2,
      bgType: "solid",
    },
  },
  {
    name: "Modern",
    config: {
      primaryColor: "#6366f1",
      secondaryColor: "#a5b4fc",
      backgroundColor: "#f8fafc",
      surfaceColor: "#ffffff",
      primaryTextColor: "#1e293b",
      secondaryTextColor: "#64748b",
      headingFont: "'Poppins', sans-serif",
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
      primaryColor: "#d4626a",
      secondaryColor: "#f4c4c9",
      backgroundColor: "#fdf5f6",
      surfaceColor: "#ffffff",
      primaryTextColor: "#7a3b40",
      secondaryTextColor: "#b07075",
      headingFont: "'Great Vibes', cursive",
      bodyFont: "'Lora', Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 16,
      bgType: "gradient",
      bgGradient: "linear-gradient(135deg, #fdf5f6 0%, #fce8ea 100%)",
    },
  },
  {
    name: "Luxury",
    config: {
      primaryColor: "#c5a572",
      secondaryColor: "#e8d5b7",
      backgroundColor: "#1a1a1a",
      surfaceColor: "#2a2a2a",
      primaryTextColor: "#f5e6d3",
      secondaryTextColor: "#c5a572",
      headingFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Lora', Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 4,
      bgType: "gradient",
      bgGradient: "linear-gradient(135deg, #1a1a1a 0%, #2a2520 100%)",
    },
  },
  {
    name: "Botanical",
    config: {
      primaryColor: "#4a7c59",
      secondaryColor: "#a8c9a3",
      backgroundColor: "#f4f7f2",
      surfaceColor: "#ffffff",
      primaryTextColor: "#2d4a35",
      secondaryTextColor: "#6b8e6b",
      headingFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Lora', Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  {
    name: "Neutral",
    config: {
      primaryColor: "#8b7355",
      secondaryColor: "#c4b59a",
      backgroundColor: "#f7f5f0",
      surfaceColor: "#ffffff",
      primaryTextColor: "#4a3f35",
      secondaryTextColor: "#8b7d6b",
      headingFont: "'Lora', Georgia, serif",
      bodyFont: "'Lora', Georgia, serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  {
    name: "Dark",
    config: {
      primaryColor: "#e2b871",
      secondaryColor: "#a08850",
      backgroundColor: "#1c1c1e",
      surfaceColor: "#2c2c2e",
      primaryTextColor: "#f5f5f5",
      secondaryTextColor: "#aeaeb2",
      headingFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 12,
      bgType: "solid",
    },
  },
  {
    name: "Editorial",
    config: {
      primaryColor: "#c0392b",
      secondaryColor: "#e67e22",
      backgroundColor: "#fdfdfd",
      surfaceColor: "#f8f8f8",
      primaryTextColor: "#1a1a1a",
      secondaryTextColor: "#7f8c8d",
      headingFont: "'Merriweather', Georgia, serif",
      bodyFont: "'Merriweather', Georgia, serif",
      fontScale: "md",
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
  { label: "Lora (serif)", value: "'Lora', Georgia, serif" },
  { label: "Merriweather (serif)", value: "'Merriweather', Georgia, serif" },
  { label: "Playfair Display (serif)", value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant Garamond (serif)", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Inter (sans-serif)", value: "'Inter', sans-serif" },
  { label: "Poppins (sans-serif)", value: "'Poppins', sans-serif" },
  { label: "Roboto (sans-serif)", value: "'Roboto', sans-serif" },
  { label: "Great Vibes (cursive)", value: "'Great Vibes', cursive" },
  { label: "Dancing Script (cursive)", value: "'Dancing Script', cursive" },
  { label: "System UI", value: "system-ui, sans-serif" },
  { label: "Courier (mono)", value: "'Courier New', monospace" },
];

export const HEADING_FONT_OPTIONS: FontOption[] = RICH_FONT_OPTIONS;

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
    vars["--event-bg-image"] = theme.bgGradient;
  } else if (theme.bgType === "image" && theme.bgImage) {
    vars["--event-bg-image"] = `url(${theme.bgImage})`;
    vars["--event-bg-position"] = theme.bgImagePosition ?? "center";
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
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length >= 2 && slug.length <= 80;
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) return DEFAULT_THEME;
  const obj = json as Record<string, unknown>;
  return {
    ...DEFAULT_THEME,
    ...obj,
  } as unknown as ThemeConfig;
}

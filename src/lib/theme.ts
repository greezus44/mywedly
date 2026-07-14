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
  bg: "#2a1a0f",
  surface: "#3d2817",
  surfaceAlt: "rgba(255,255,255,0.06)",
  border: "#6b4423",
  text: "#f5e6d3",
  heading: "#f5e6d3",
  muted: "#c4a574",
  primary: "#c2410c",
  primaryHover: "#9a3412",
  primaryFg: "#fff7ed",
  accent: "#e8a87c",
  bgType: "gradient",
  bgGradient: "linear-gradient(135deg, #2a1a0f 0%, #3d2817 100%)",
};

const FONT_SCALE_MAP: Record<string, number> = { sm: 0.9, md: 1, lg: 1.1 };
const RADIUS_MAP: Record<string, string> = {
  rounded: "0.5rem",
  soft: "0.25rem",
  square: "0rem",
};
const BUTTON_SIZE_MAP: Record<string, string> = { sm: "0.5rem 1rem", md: "0.625rem 1.5rem", lg: "0.75rem 2rem" };

export function simplifiedToFullTheme(s: SimplifiedThemeConfig): ThemeConfig {
  const radius = RADIUS_MAP[s.buttonStyle] ?? "0.5rem";
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
    radius: `${(s.cornerRadius ?? 8) / 16}rem`,
    fontScale: FONT_SCALE_MAP[s.fontScale] ?? 1,
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
  const fontScale = t.fontScale <= 0.95 ? "sm" : t.fontScale >= 1.05 ? "lg" : "md";
  const radiusNum = Math.round(parseFloat(t.radius) * 16);
  return {
    primaryColor: t.primary,
    secondaryColor: t.accent,
    backgroundColor: t.bg,
    surfaceColor: t.surface,
    primaryTextColor: t.text,
    secondaryTextColor: t.muted,
    headingFont: t.fontHeading,
    bodyFont: t.fontBody,
    fontScale: fontScale as "sm" | "md" | "lg",
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

export const RICH_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Palatino", value: "Palatino, serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Courier", value: "'Courier New', monospace" },
  { label: "Brush Script", value: "'Brush Script MT', cursive" },
  { label: "Lucida Handwriting", value: "'Lucida Handwriting', cursive" },
  { label: "Comic Sans", value: "'Comic Sans MS', cursive" },
];

export const HEADING_FONT_OPTIONS: { label: string; value: string }[] = RICH_FONT_OPTIONS;

function preset(
  name: string,
  s: Omit<SimplifiedThemeConfig, never>
): { name: string; config: SimplifiedThemeConfig } {
  return { name, config: s };
}

export const THEME_PRESETS: { name: string; config: SimplifiedThemeConfig }[] = [
  preset("Minimal", {
    primaryColor: "#0f172a", secondaryColor: "#cbd5e1", backgroundColor: "#ffffff",
    surfaceColor: "#f8fafc", primaryTextColor: "#0f172a", secondaryTextColor: "#64748b",
    headingFont: "Inter, sans-serif", bodyFont: "Inter, sans-serif", fontScale: "md",
    buttonStyle: "square", buttonSize: "md", cornerRadius: 2, bgType: "solid",
  }),
  preset("Elegant", {
    primaryColor: "#7c3aed", secondaryColor: "#e9d5ff", backgroundColor: "#faf5ff",
    surfaceColor: "#ffffff", primaryTextColor: "#4c1d95", secondaryTextColor: "#7c3aed",
    headingFont: "Georgia, serif", bodyFont: "Georgia, serif", fontScale: "md",
    buttonStyle: "rounded", buttonSize: "md", cornerRadius: 8, bgType: "solid",
  }),
  preset("Classic", {
    primaryColor: "#1e3a8a", secondaryColor: "#dbeafe", backgroundColor: "#f8fafc",
    surfaceColor: "#ffffff", primaryTextColor: "#1e293b", secondaryTextColor: "#475569",
    headingFont: "'Times New Roman', serif", bodyFont: "Georgia, serif", fontScale: "md",
    buttonStyle: "soft", buttonSize: "md", cornerRadius: 4, bgType: "solid",
  }),
  preset("Modern", {
    primaryColor: "#0ea5e9", secondaryColor: "#bae6fd", backgroundColor: "#f0f9ff",
    surfaceColor: "#ffffff", primaryTextColor: "#0c4a6e", secondaryTextColor: "#0369a1",
    headingFont: "Inter, sans-serif", bodyFont: "Inter, sans-serif", fontScale: "md",
    buttonStyle: "rounded", buttonSize: "md", cornerRadius: 12, bgType: "solid",
  }),
  preset("Romantic", {
    primaryColor: "#db2777", secondaryColor: "#fbcfe8", backgroundColor: "#fdf2f8",
    surfaceColor: "#ffffff", primaryTextColor: "#831843", secondaryTextColor: "#be185d",
    headingFont: "'Brush Script MT', cursive", bodyFont: "Georgia, serif", fontScale: "md",
    buttonStyle: "rounded", buttonSize: "md", cornerRadius: 16, bgType: "solid",
  }),
  preset("Luxury", {
    primaryColor: "#b45309", secondaryColor: "#fde68a", backgroundColor: "#1c1917",
    surfaceColor: "#292524", primaryTextColor: "#fef3c7", secondaryTextColor: "#d6d3d1",
    headingFont: "Garamond, serif", bodyFont: "Garamond, serif", fontScale: "md",
    buttonStyle: "soft", buttonSize: "md", cornerRadius: 4, bgType: "gradient",
    bgGradient: "linear-gradient(135deg, #1c1917 0%, #44403c 100%)",
  }),
  preset("Botanical", {
    primaryColor: "#15803d", secondaryColor: "#bbf7d0", backgroundColor: "#f0fdf4",
    surfaceColor: "#ffffff", primaryTextColor: "#14532d", secondaryTextColor: "#16a34a",
    headingFont: "Palatino, serif", bodyFont: "Palatino, serif", fontScale: "md",
    buttonStyle: "rounded", buttonSize: "md", cornerRadius: 10, bgType: "solid",
  }),
  preset("Neutral", {
    primaryColor: "#57534e", secondaryColor: "#e7e5e4", backgroundColor: "#fafaf9",
    surfaceColor: "#ffffff", primaryTextColor: "#1c1917", secondaryTextColor: "#78716c",
    headingFont: "Helvetica, sans-serif", bodyFont: "Helvetica, sans-serif", fontScale: "md",
    buttonStyle: "soft", buttonSize: "md", cornerRadius: 6, bgType: "solid",
  }),
  preset("Dark", {
    primaryColor: "#f59e0b", secondaryColor: "#fde68a", backgroundColor: "#0f172a",
    surfaceColor: "#1e293b", primaryTextColor: "#f1f5f9", secondaryTextColor: "#94a3b8",
    headingFont: "Inter, sans-serif", bodyFont: "Inter, sans-serif", fontScale: "md",
    buttonStyle: "rounded", buttonSize: "md", cornerRadius: 8, bgType: "solid",
  }),
  preset("Editorial", {
    primaryColor: "#0f172a", secondaryColor: "#fbbf24", backgroundColor: "#fefce8",
    surfaceColor: "#ffffff", primaryTextColor: "#0f172a", secondaryTextColor: "#475569",
    headingFont: "Georgia, serif", bodyFont: "Inter, sans-serif", fontScale: "lg",
    buttonStyle: "square", buttonSize: "lg", cornerRadius: 0, bgType: "solid",
  }),
];

export function themeToEventCssVars(t: ThemeConfig): Record<string, string> {
  const vars: Record<string, string> = {
    "--event-bg": t.bg,
    "--event-surface": t.surface,
    "--event-surface-alt": t.surfaceAlt,
    "--event-border": t.border,
    "--event-text": t.text,
    "--event-heading": t.heading,
    "--event-muted": t.muted,
    "--event-primary": t.primary,
    "--event-primary-hover": t.primaryHover,
    "--event-primary-fg": t.primaryFg,
    "--event-accent": t.accent,
    "--event-font-heading": t.fontHeading,
    "--event-font-body": t.fontBody,
    "--event-font-rich": t.fontRich,
    "--event-radius": t.radius,
    "--event-font-scale": String(t.fontScale),
  };
  if (t.bgGradient) vars["--event-bg-gradient"] = t.bgGradient;
  if (t.bgImage) vars["--event-bg-image"] = `url(${t.bgImage})`;
  if (t.bgImagePosition) vars["--event-bg-image-position"] = t.bgImagePosition;
  if (t.bgOverlayOpacity != null) vars["--event-bg-overlay-opacity"] = String(t.bgOverlayOpacity);
  return vars;
}

export function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length >= 2;
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object") return { ...DEFAULT_THEME };
  const obj = json as Record<string, unknown>;
  return {
    ...DEFAULT_THEME,
    ...(obj as Partial<ThemeConfig>),
  };
}

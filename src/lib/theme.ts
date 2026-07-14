export interface ThemeButtonConfig {
  bgColor?: string;
  bgColorHover?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number;
}

export interface ThemeConfig {
  colors: {
    bg: string; surface: string; surfaceAlt: string; border: string;
    text: string; heading: string; muted: string;
    primary: string; primaryHover: string; primaryFg: string; accent: string;
  };
  fonts: { heading: string; body: string; rich: string };
  radius: string;
  fontScale: number;
  button?: ThemeButtonConfig;
}

export interface SimplifiedThemeConfig {
  bg: string; surface: string; surfaceAlt: string; border: string;
  text: string; heading: string; muted: string;
  primary: string; primaryHover: string; primaryFg: string; accent: string;
  headingFont: string; bodyFont: string; richFont: string;
  radius: string; fontScale: number;
  buttonBgColor?: string; buttonBgColorHover?: string; buttonColor?: string;
  buttonFontFamily?: string; buttonFontSize?: string; buttonFontWeight?: number;
}

export interface FontOption {
  label: string;
  value: string;
  stack: string;
}

export const HEADING_FONT_OPTIONS: FontOption[] = [
  { label: "Georgia", value: "Georgia, serif", stack: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif", stack: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif", stack: "'Cormorant Garamond', serif" },
  { label: "Lora", value: "'Lora', serif", stack: "'Lora', serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif", stack: "'EB Garamond', serif" },
  { label: "Cardo", value: "'Cardo', serif", stack: "'Cardo', serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif", stack: "'Bodoni Moda', serif" },
  { label: "Inter", value: "'Inter', sans-serif", stack: "'Inter', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif", stack: "'Montserrat', sans-serif" },
  { label: "Caveat", value: "'Caveat', cursive", stack: "'Caveat', cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive", stack: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive", stack: "'Great Vibes', cursive" },
  { label: "Imperial Script", value: "'Imperial Script', cursive", stack: "'Imperial Script', cursive" },
  { label: "Sans Serif", value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
];

export const RICH_FONT_OPTIONS: FontOption[] = [
  { label: "Georgia", value: "Georgia, serif", stack: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif", stack: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif", stack: "'Cormorant Garamond', serif" },
  { label: "Lora", value: "'Lora', serif", stack: "'Lora', serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif", stack: "'EB Garamond', serif" },
  { label: "Cardo", value: "'Cardo', serif", stack: "'Cardo', serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif", stack: "'Bodoni Moda', serif" },
  { label: "Inter", value: "'Inter', sans-serif", stack: "'Inter', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif", stack: "'Montserrat', sans-serif" },
  { label: "Caveat", value: "'Caveat', cursive", stack: "'Caveat', cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive", stack: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive", stack: "'Great Vibes', cursive" },
  { label: "Imperial Script", value: "'Imperial Script', cursive", stack: "'Imperial Script', cursive" },
  { label: "Sans Serif", value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
];

export const DEFAULT_THEME: ThemeConfig = {
  colors: { bg: "#fffbeb", surface: "#ffffff", surfaceAlt: "rgba(255,255,255,0.08)", border: "#fde68a", text: "#78350f", heading: "#78350f", muted: "#92400e", primary: "#b45309", primaryHover: "#92400e", primaryFg: "#ffffff", accent: "#d97706" },
  fonts: { heading: "Georgia, serif", body: "Georgia, serif", rich: "Georgia, serif" },
  radius: "0.5rem",
  fontScale: 1,
  button: { bgColor: undefined, bgColorHover: undefined, color: undefined, fontFamily: undefined, fontSize: undefined, fontWeight: undefined },
};

export const RUSTY_THEME: ThemeConfig = {
  colors: { bg: "#f5efe6", surface: "#faf6f0", surfaceAlt: "rgba(250,246,240,0.08)", border: "#d4c5a9", text: "#3d2b1f", heading: "#3d2b1f", muted: "#6b5a4a", primary: "#8b6f47", primaryHover: "#6b5a3a", primaryFg: "#faf6f0", accent: "#a67c52" },
  fonts: { heading: "'Cormorant Garamond', serif", body: "'EB Garamond', serif", rich: "'EB Garamond', serif" },
  radius: "0.25rem",
  fontScale: 1,
  button: {},
};

export const THEME_PRESETS: { name: string; theme: ThemeConfig }[] = [
  { name: "Classic", theme: DEFAULT_THEME },
  { name: "Rustic", theme: RUSTY_THEME },
  { name: "Modern", theme: { colors: { bg: "#ffffff", surface: "#f8fafc", surfaceAlt: "rgba(248,250,252,0.08)", border: "#e2e8f0", text: "#1e293b", heading: "#0f172a", muted: "#64748b", primary: "#0ea5e9", primaryHover: "#0284c7", primaryFg: "#ffffff", accent: "#06b6d4" }, fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif", rich: "'Inter', sans-serif" }, radius: "0.75rem", fontScale: 1, button: {} } },
  { name: "Garden", theme: { colors: { bg: "#f0f4ed", surface: "#ffffff", surfaceAlt: "rgba(255,255,255,0.08)", border: "#c8d5b9", text: "#2d4a22", heading: "#2d4a22", muted: "#5a7a48", primary: "#4a7c2e", primaryHover: "#3a6b1e", primaryFg: "#ffffff", accent: "#6b9b3e" }, fonts: { heading: "'Cormorant Garamond', serif", body: "'EB Garamond', serif", rich: "'EB Garamond', serif" }, radius: "0.5rem", fontScale: 1, button: {} } },
  { name: "Blush", theme: { colors: { bg: "#fdf2f8", surface: "#ffffff", surfaceAlt: "rgba(255,255,255,0.08)", border: "#fbcfe8", text: "#831843", heading: "#831843", muted: "#9d174d", primary: "#db2777", primaryHover: "#be185d", primaryFg: "#ffffff", accent: "#ec4899" }, fonts: { heading: "'Playfair Display', serif", body: "'Lora', serif", rich: "'Lora', serif" }, radius: "0.5rem", fontScale: 1, button: {} } },
  { name: "Midnight", theme: { colors: { bg: "#0f172a", surface: "#1e293b", surfaceAlt: "rgba(30,41,59,0.5)", border: "#334155", text: "#e2e8f0", heading: "#f8fafc", muted: "#94a3b8", primary: "#3b82f6", primaryHover: "#2563eb", primaryFg: "#ffffff", accent: "#60a5fa" }, fonts: { heading: "'Bodoni Moda', serif", body: "'Cardo', serif", rich: "'Cardo', serif" }, radius: "0.5rem", fontScale: 1, button: {} } },
  { name: "Coastal", theme: { colors: { bg: "#f0f9ff", surface: "#ffffff", surfaceAlt: "rgba(255,255,255,0.08)", border: "#bae6fd", text: "#0c4a6e", heading: "#0c4a6e", muted: "#0369a1", primary: "#0284c7", primaryHover: "#0369a1", primaryFg: "#ffffff", accent: "#38bdf8" }, fonts: { heading: "'Montserrat', sans-serif", body: "'Inter', sans-serif", rich: "'Inter', sans-serif" }, radius: "0.5rem", fontScale: 1, button: {} } },
  { name: "Lavender", theme: { colors: { bg: "#faf5ff", surface: "#ffffff", surfaceAlt: "rgba(255,255,255,0.08)", border: "#e9d5ff", text: "#581c87", heading: "#581c87", muted: "#7e22ce", primary: "#9333ea", primaryHover: "#7e22ce", primaryFg: "#ffffff", accent: "#a855f7" }, fonts: { heading: "'Cormorant Garamond', serif", body: "'Lora', serif", rich: "'Lora', serif" }, radius: "0.5rem", fontScale: 1, button: {} } },
  { name: "Sunset", theme: { colors: { bg: "#fff7ed", surface: "#ffffff", surfaceAlt: "rgba(255,255,255,0.08)", border: "#fed7aa", text: "#7c2d12", heading: "#7c2d12", muted: "#9a3412", primary: "#ea580c", primaryHover: "#c2410c", primaryFg: "#ffffff", accent: "#fb923c" }, fonts: { heading: "'Playfair Display', serif", body: "'EB Garamond', serif", rich: "'EB Garamond', serif" }, radius: "0.5rem", fontScale: 1, button: {} } },
  { name: "Sage", theme: { colors: { bg: "#f1f5f0", surface: "#ffffff", surfaceAlt: "rgba(255,255,255,0.08)", border: "#c8d6c5", text: "#3a4a36", heading: "#3a4a36", muted: "#5a6b54", primary: "#6b8e5a", primaryHover: "#5a7a4a", primaryFg: "#ffffff", accent: "#8baa76" }, fonts: { heading: "'Lora', serif", body: "'EB Garamond', serif", rich: "'EB Garamond', serif" }, radius: "0.5rem", fontScale: 1, button: {} } },
];

export function simplifiedToFullTheme(s: SimplifiedThemeConfig): ThemeConfig {
  return {
    colors: { bg: s.bg, surface: s.surface, surfaceAlt: s.surfaceAlt, border: s.border, text: s.text, heading: s.heading, muted: s.muted, primary: s.primary, primaryHover: s.primaryHover, primaryFg: s.primaryFg, accent: s.accent },
    fonts: { heading: s.headingFont, body: s.bodyFont, rich: s.richFont },
    radius: s.radius,
    fontScale: s.fontScale,
    button: { bgColor: s.buttonBgColor, bgColorHover: s.buttonBgColorHover, color: s.buttonColor, fontFamily: s.buttonFontFamily, fontSize: s.buttonFontSize, fontWeight: s.buttonFontWeight },
  };
}

export function fullToSimplifiedTheme(t: ThemeConfig): SimplifiedThemeConfig {
  return {
    bg: t.colors.bg, surface: t.colors.surface, surfaceAlt: t.colors.surfaceAlt, border: t.colors.border,
    text: t.colors.text, heading: t.colors.heading, muted: t.colors.muted,
    primary: t.colors.primary, primaryHover: t.colors.primaryHover, primaryFg: t.colors.primaryFg, accent: t.colors.accent,
    headingFont: t.fonts.heading, bodyFont: t.fonts.body, richFont: t.fonts.rich,
    radius: t.radius, fontScale: t.fontScale,
    buttonBgColor: t.button?.bgColor, buttonBgColorHover: t.button?.bgColorHover, buttonColor: t.button?.color,
    buttonFontFamily: t.button?.fontFamily, buttonFontSize: t.button?.fontSize, buttonFontWeight: t.button?.fontWeight,
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
    "--event-btn-bg": theme.button?.bgColor || theme.colors.primary,
    "--event-btn-bg-hover": theme.button?.bgColorHover || theme.colors.primaryHover,
    "--event-btn-color": theme.button?.color || theme.colors.primaryFg,
    "--event-btn-font-family": theme.button?.fontFamily || theme.fonts.heading,
    "--event-btn-font-size": theme.button?.fontSize || "0.875rem",
    "--event-btn-font-weight": String(theme.button?.fontWeight ?? 600),
  };
}

export function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length > 0 && slug.length <= 100;
}

export function jsonToTheme(json: unknown): ThemeConfig {
  const obj = (json ?? {}) as Record<string, unknown>;
  const colors = (obj.colors as Record<string, unknown> | undefined) ?? {};
  const fonts = (obj.fonts as Record<string, unknown> | undefined) ?? {};
  const button = (obj.button as Record<string, unknown> | undefined) ?? {};
  return {
    colors: {
      bg: (colors.bg as string) || DEFAULT_THEME.colors.bg,
      surface: (colors.surface as string) || DEFAULT_THEME.colors.surface,
      surfaceAlt: (colors.surfaceAlt as string) || DEFAULT_THEME.colors.surfaceAlt,
      border: (colors.border as string) || DEFAULT_THEME.colors.border,
      text: (colors.text as string) || DEFAULT_THEME.colors.text,
      heading: (colors.heading as string) || DEFAULT_THEME.colors.heading,
      muted: (colors.muted as string) || DEFAULT_THEME.colors.muted,
      primary: (colors.primary as string) || DEFAULT_THEME.colors.primary,
      primaryHover: (colors.primaryHover as string) || DEFAULT_THEME.colors.primaryHover,
      primaryFg: (colors.primaryFg as string) || DEFAULT_THEME.colors.primaryFg,
      accent: (colors.accent as string) || DEFAULT_THEME.colors.accent,
    },
    fonts: {
      heading: (fonts.heading as string) || DEFAULT_THEME.fonts.heading,
      body: (fonts.body as string) || DEFAULT_THEME.fonts.body,
      rich: (fonts.rich as string) || DEFAULT_THEME.fonts.rich,
    },
    radius: (obj.radius as string) || DEFAULT_THEME.radius,
    fontScale: typeof obj.fontScale === "number" ? obj.fontScale : 1,
    button: {
      bgColor: button.bgColor as string | undefined,
      bgColorHover: button.bgColorHover as string | undefined,
      color: button.color as string | undefined,
      fontFamily: button.fontFamily as string | undefined,
      fontSize: button.fontSize as string | undefined,
      fontWeight: typeof button.fontWeight === "number" ? button.fontWeight : undefined,
    },
  };
}

import type { Json } from "./supabase";

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
  };
  fonts: {
    heading: string;
    body: string;
    rich: string;
  };
  radius: string;
  fontScale: number;
  button?: ThemeButtonConfig;
}

export interface SimplifiedThemeConfig {
  bg?: string;
  surface?: string;
  border?: string;
  text?: string;
  heading?: string;
  muted?: string;
  primary?: string;
  primaryHover?: string;
  primaryFg?: string;
  accent?: string;
  headingFont?: string;
  bodyFont?: string;
  richFont?: string;
  radius?: string;
  fontScale?: number;
  buttonBgColor?: string;
  buttonBgColorHover?: string;
  buttonColor?: string;
  buttonFontFamily?: string;
  buttonFontSize?: string;
  buttonFontWeight?: number;
}

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
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
  },
  fonts: {
    heading: "Georgia, serif",
    body: "Georgia, serif",
    rich: "Georgia, serif",
  },
  radius: "0.5rem",
  fontScale: 1,
};

export const RUSTY_THEME: ThemeConfig = {
  colors: {
    bg: "#1a1410",
    surface: "#2a201a",
    surfaceAlt: "rgba(255,255,255,0.06)",
    border: "#3d2e24",
    text: "#e8d5c4",
    heading: "#f0e0d0",
    muted: "#b8a090",
    primary: "#c8704a",
    primaryHover: "#b0603a",
    primaryFg: "#fff8f0",
    accent: "#e89060",
  },
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'EB Garamond', serif",
    rich: "'EB Garamond', serif",
  },
  radius: "0.25rem",
  fontScale: 1,
};

export const HEADING_FONT_OPTIONS = [
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Cardo", value: "'Cardo', serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Caveat", value: "'Caveat', cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
];

export const RICH_FONT_OPTIONS = [
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Cardo", value: "'Cardo', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Caveat", value: "'Caveat', cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
];

export const THEME_PRESETS: { name: string; theme: ThemeConfig }[] = [
  {
    name: "Rustic Gold",
    theme: DEFAULT_THEME,
  },
  {
    name: "Rusty Dark",
    theme: RUSTY_THEME,
  },
  {
    name: "Blush Rose",
    theme: {
      colors: {
        bg: "#fdf2f8",
        surface: "#ffffff",
        surfaceAlt: "rgba(255,255,255,0.08)",
        border: "#fbcfe8",
        text: "#831843",
        heading: "#831843",
        muted: "#be185d",
        primary: "#db2777",
        primaryHover: "#be185d",
        primaryFg: "#ffffff",
        accent: "#ec4899",
      },
      fonts: {
        heading: "'Cormorant Garamond', serif",
        body: "'Lora', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.5rem",
      fontScale: 1,
    },
  },
  {
    name: "Sage Garden",
    theme: {
      colors: {
        bg: "#f0fdf4",
        surface: "#ffffff",
        surfaceAlt: "rgba(255,255,255,0.08)",
        border: "#bbf7d0",
        text: "#14532d",
        heading: "#14532d",
        muted: "#166534",
        primary: "#16a34a",
        primaryHover: "#15803d",
        primaryFg: "#ffffff",
        accent: "#22c55e",
      },
      fonts: {
        heading: "'Lora', serif",
        body: "'EB Garamond', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.375rem",
      fontScale: 1,
    },
  },
  {
    name: "Ocean Blue",
    theme: {
      colors: {
        bg: "#f0f9ff",
        surface: "#ffffff",
        surfaceAlt: "rgba(255,255,255,0.08)",
        border: "#bae6fd",
        text: "#0c4a6e",
        heading: "#0c4a6e",
        muted: "#0369a1",
        primary: "#0284c7",
        primaryHover: "#0369a1",
        primaryFg: "#ffffff",
        accent: "#0ea5e9",
      },
      fonts: {
        heading: "'Montserrat', sans-serif",
        body: "'Inter', sans-serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.5rem",
      fontScale: 1,
    },
  },
  {
    name: "Lavender Dream",
    theme: {
      colors: {
        bg: "#faf5ff",
        surface: "#ffffff",
        surfaceAlt: "rgba(255,255,255,0.08)",
        border: "#ddd6fe",
        text: "#4c1d95",
        heading: "#4c1d95",
        muted: "#6d28d9",
        primary: "#7c3aed",
        primaryHover: "#6d28d9",
        primaryFg: "#ffffff",
        accent: "#8b5cf6",
      },
      fonts: {
        heading: "'Playfair Display', serif",
        body: "'Lora', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.5rem",
      fontScale: 1,
    },
  },
  {
    name: "Terracotta",
    theme: {
      colors: {
        bg: "#fdf4f0",
        surface: "#ffffff",
        surfaceAlt: "rgba(255,255,255,0.08)",
        border: "#fed7aa",
        text: "#7c2d12",
        heading: "#7c2d12",
        muted: "#9a3412",
        primary: "#c2410c",
        primaryHover: "#9a3412",
        primaryFg: "#ffffff",
        accent: "#ea580c",
      },
      fonts: {
        heading: "'Cormorant Garamond', serif",
        body: "'EB Garamond', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.25rem",
      fontScale: 1,
    },
  },
  {
    name: "Midnight",
    theme: {
      colors: {
        bg: "#0c0a09",
        surface: "#1c1917",
        surfaceAlt: "rgba(255,255,255,0.05)",
        border: "#292524",
        text: "#e7e5e4",
        heading: "#fafaf9",
        muted: "#a8a29e",
        primary: "#a78bfa",
        primaryHover: "#8b5cf6",
        primaryFg: "#0c0a09",
        accent: "#c4b5fd",
      },
      fonts: {
        heading: "'Bodoni Moda', serif",
        body: "'Cardo', serif",
        rich: "'Cardo', serif",
      },
      radius: "0.25rem",
      fontScale: 1,
    },
  },
  {
    name: "Ivory Classic",
    theme: {
      colors: {
        bg: "#fefce8",
        surface: "#fffbeb",
        surfaceAlt: "rgba(0,0,0,0.03)",
        border: "#fde68a",
        text: "#451a03",
        heading: "#451a03",
        muted: "#78350f",
        primary: "#854d0e",
        primaryHover: "#713f12",
        primaryFg: "#fffbeb",
        accent: "#a16207",
      },
      fonts: {
        heading: "'Cormorant Garamond', serif",
        body: "'EB Garamond', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.5rem",
      fontScale: 1,
    },
  },
  {
    name: "Forest Green",
    theme: {
      colors: {
        bg: "#f2f8f5",
        surface: "#ffffff",
        surfaceAlt: "rgba(255,255,255,0.08)",
        border: "#d1e7dd",
        text: "#1a3c2e",
        heading: "#1a3c2e",
        muted: "#2d5a45",
        primary: "#2d6a4f",
        primaryHover: "#1b4332",
        primaryFg: "#ffffff",
        accent: "#40916c",
      },
      fonts: {
        heading: "'Playfair Display', serif",
        body: "'Lora', serif",
        rich: "'EB Garamond', serif",
      },
      radius: "0.375rem",
      fontScale: 1,
    },
  },
];

export function simplifiedToFullTheme(s: SimplifiedThemeConfig | null | undefined): ThemeConfig {
  if (!s) return DEFAULT_THEME;
  return {
    colors: {
      bg: s.bg ?? DEFAULT_THEME.colors.bg,
      surface: s.surface ?? DEFAULT_THEME.colors.surface,
      surfaceAlt: DEFAULT_THEME.colors.surfaceAlt,
      border: s.border ?? DEFAULT_THEME.colors.border,
      text: s.text ?? DEFAULT_THEME.colors.text,
      heading: s.heading ?? DEFAULT_THEME.colors.heading,
      muted: s.muted ?? DEFAULT_THEME.colors.muted,
      primary: s.primary ?? DEFAULT_THEME.colors.primary,
      primaryHover: s.primaryHover ?? DEFAULT_THEME.colors.primaryHover,
      primaryFg: s.primaryFg ?? DEFAULT_THEME.colors.primaryFg,
      accent: s.accent ?? DEFAULT_THEME.colors.accent,
    },
    fonts: {
      heading: s.headingFont ?? DEFAULT_THEME.fonts.heading,
      body: s.bodyFont ?? DEFAULT_THEME.fonts.body,
      rich: s.richFont ?? DEFAULT_THEME.fonts.rich,
    },
    radius: s.radius ?? DEFAULT_THEME.radius,
    fontScale: s.fontScale ?? DEFAULT_THEME.fontScale,
    button: {
      bgColor: s.buttonBgColor,
      bgColorHover: s.buttonBgColorHover,
      color: s.buttonColor,
      fontFamily: s.buttonFontFamily,
      fontSize: s.buttonFontSize,
      fontWeight: s.buttonFontWeight,
    },
  };
}

export function fullToSimplifiedTheme(t: ThemeConfig | null | undefined): SimplifiedThemeConfig {
  if (!t) return {};
  return {
    bg: t.colors.bg,
    surface: t.colors.surface,
    border: t.colors.border,
    text: t.colors.text,
    heading: t.colors.heading,
    muted: t.colors.muted,
    primary: t.colors.primary,
    primaryHover: t.colors.primaryHover,
    primaryFg: t.colors.primaryFg,
    accent: t.colors.accent,
    headingFont: t.fonts.heading,
    bodyFont: t.fonts.body,
    richFont: t.fonts.rich,
    radius: t.radius,
    fontScale: t.fontScale,
    buttonBgColor: t.button?.bgColor,
    buttonBgColorHover: t.button?.bgColorHover,
    buttonColor: t.button?.color,
    buttonFontFamily: t.button?.fontFamily,
    buttonFontSize: t.button?.fontSize,
    buttonFontWeight: t.button?.fontWeight,
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
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function jsonToTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) return DEFAULT_THEME;
  const obj = json as Record<string, unknown>;
  const colors = (obj.colors as Record<string, unknown> | undefined) ?? {};
  const fonts = (obj.fonts as Record<string, unknown> | undefined) ?? {};
  const button = (obj.button as Record<string, unknown> | undefined) ?? {};
  return {
    colors: {
      bg: (colors.bg as string) ?? DEFAULT_THEME.colors.bg,
      surface: (colors.surface as string) ?? DEFAULT_THEME.colors.surface,
      surfaceAlt: (colors.surfaceAlt as string) ?? DEFAULT_THEME.colors.surfaceAlt,
      border: (colors.border as string) ?? DEFAULT_THEME.colors.border,
      text: (colors.text as string) ?? DEFAULT_THEME.colors.text,
      heading: (colors.heading as string) ?? DEFAULT_THEME.colors.heading,
      muted: (colors.muted as string) ?? DEFAULT_THEME.colors.muted,
      primary: (colors.primary as string) ?? DEFAULT_THEME.colors.primary,
      primaryHover: (colors.primaryHover as string) ?? DEFAULT_THEME.colors.primaryHover,
      primaryFg: (colors.primaryFg as string) ?? DEFAULT_THEME.colors.primaryFg,
      accent: (colors.accent as string) ?? DEFAULT_THEME.colors.accent,
    },
    fonts: {
      heading: (fonts.heading as string) ?? DEFAULT_THEME.fonts.heading,
      body: (fonts.body as string) ?? DEFAULT_THEME.fonts.body,
      rich: (fonts.rich as string) ?? DEFAULT_THEME.fonts.rich,
    },
    radius: (obj.radius as string) ?? DEFAULT_THEME.radius,
    fontScale: typeof obj.fontScale === "number" ? obj.fontScale : DEFAULT_THEME.fontScale,
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

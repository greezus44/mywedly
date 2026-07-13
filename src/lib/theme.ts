// Theme system for MyWedly events.
// ThemeConfig is the internal/full representation (all CSS variables).
// SimplifiedThemeConfig is the host-facing simplified representation.

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

// --- Color helpers (hex-based) ---

function clamp(n: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToRgba(rgb: string, alpha: number): string {
  const c = hexToRgb(rgb);
  if (!c) return rgb;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

export function darkenColor(hex: string, amount: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return rgbToHex(c.r * (1 - amount), c.g * (1 - amount), c.b * (1 - amount));
}

export function lightenColor(hex: string, amount: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return rgbToHex(c.r + (255 - c.r) * amount, c.g + (255 - c.g) * amount, c.b + (255 - c.b) * amount);
}

function fontScaleToNumber(scale: "sm" | "md" | "lg"): number {
  if (scale === "sm") return 0.875;
  if (scale === "lg") return 1.125;
  return 1;
}

function numberToFontScale(n: number): "sm" | "md" | "lg" {
  if (n <= 0.95) return "sm";
  if (n >= 1.05) return "lg";
  return "md";
}

// --- Default themes ---

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
  bg: "#f5efe6",
  surface: "#fbf7f0",
  surfaceAlt: "rgba(139,90,43,0.08)",
  border: "#c4a47c",
  text: "#3d2b1f",
  heading: "#5c3a1e",
  muted: "#8b6f47",
  primary: "#8b5a2b",
  primaryHover: "#6f4621",
  primaryFg: "#fbf7f0",
  accent: "#b08855",
  fontHeading: "'Cormorant Garamond', Georgia, serif",
  fontBody: "'EB Garamond', Georgia, serif",
  fontRich: "'EB Garamond', Georgia, serif",
  radius: "0.25rem",
  fontScale: 1,
  buttonStyle: "soft",
  buttonSize: "md",
  bgType: "solid",
};

// --- Conversions ---

export function simplifiedToFullTheme(s: SimplifiedThemeConfig): ThemeConfig {
  return {
    primary: s.primaryColor,
    primaryHover: darkenColor(s.primaryColor, 0.1),
    primaryFg: "#ffffff",
    accent: s.secondaryColor,
    border: lightenColor(s.secondaryColor, 0.6),
    bg: s.backgroundColor,
    surfaceAlt: rgbToRgba(s.backgroundColor, 0.08),
    surface: s.surfaceColor,
    text: s.primaryTextColor,
    heading: s.primaryTextColor,
    muted: s.secondaryTextColor,
    fontHeading: s.headingFont,
    fontBody: s.bodyFont,
    fontRich: s.headingFont,
    radius: `${s.cornerRadius}px`,
    fontScale: fontScaleToNumber(s.fontScale),
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
  // Try to recover cornerRadius as a number from the radius string
  const radiusMatch = t.radius?.match(/^([\d.]+)\s*px$/);
  const cornerRadius = radiusMatch ? parseFloat(radiusMatch[1]) : 8;
  return {
    primaryColor: t.primary,
    secondaryColor: t.accent,
    backgroundColor: t.bg,
    surfaceColor: t.surface,
    primaryTextColor: t.text,
    secondaryTextColor: t.muted,
    headingFont: t.fontHeading,
    bodyFont: t.fontBody,
    fontScale: numberToFontScale(t.fontScale),
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

// --- Presets ---

export const THEME_PRESETS: Record<string, { name: string; theme: SimplifiedThemeConfig }> = {
  minimal: {
    name: "Minimal Black & White",
    theme: {
      primaryColor: "#000000",
      secondaryColor: "#6b7280",
      backgroundColor: "#ffffff",
      surfaceColor: "#f9fafb",
      primaryTextColor: "#111111",
      secondaryTextColor: "#6b7280",
      headingFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
      fontScale: "md",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 0,
      bgType: "solid",
    },
  },
  elegant: {
    name: "Elegant",
    theme: {
      primaryColor: "#1e3a5f",
      secondaryColor: "#c9a96e",
      backgroundColor: "#faf8f3",
      surfaceColor: "#ffffff",
      primaryTextColor: "#1a1a1a",
      secondaryTextColor: "#6b6b6b",
      headingFont: "'Playfair Display', Georgia, serif",
      bodyFont: "Inter, system-ui, sans-serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 6,
      bgType: "solid",
    },
  },
  classic: {
    name: "Classic",
    theme: {
      primaryColor: "#722f37",
      secondaryColor: "#d4b896",
      backgroundColor: "#fdf6e3",
      surfaceColor: "#fffaf0",
      primaryTextColor: "#3d2b1f",
      secondaryTextColor: "#7a6650",
      headingFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Cormorant Garamond', Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 4,
      bgType: "solid",
    },
  },
  modern: {
    name: "Modern",
    theme: {
      primaryColor: "#2563eb",
      secondaryColor: "#93c5fd",
      backgroundColor: "#ffffff",
      surfaceColor: "#f1f5f9",
      primaryTextColor: "#0f172a",
      secondaryTextColor: "#64748b",
      headingFont: "Montserrat, system-ui, sans-serif",
      bodyFont: "Montserrat, system-ui, sans-serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 12,
      bgType: "solid",
    },
  },
  romantic: {
    name: "Romantic",
    theme: {
      primaryColor: "#be185d",
      secondaryColor: "#f9a8d4",
      backgroundColor: "#fff5f7",
      surfaceColor: "#fff0f3",
      primaryTextColor: "#831843",
      secondaryTextColor: "#a17283",
      headingFont: "'Dancing Script', cursive",
      bodyFont: "'Lora', Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 16,
      bgType: "solid",
    },
  },
  luxury: {
    name: "Luxury",
    theme: {
      primaryColor: "#0a0a0a",
      secondaryColor: "#d4af37",
      backgroundColor: "#1a1a1a",
      surfaceColor: "#262626",
      primaryTextColor: "#f5f5f5",
      secondaryTextColor: "#a3a3a3",
      headingFont: "'Bodoni Moda', Georgia, serif",
      bodyFont: "'Bodoni Moda', Georgia, serif",
      fontScale: "md",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 2,
      bgType: "solid",
    },
  },
  botanical: {
    name: "Botanical",
    theme: {
      primaryColor: "#3a6b35",
      secondaryColor: "#a3b18a",
      backgroundColor: "#f4f1e8",
      surfaceColor: "#fffdf5",
      primaryTextColor: "#283618",
      secondaryTextColor: "#606c38",
      headingFont: "'EB Garamond', Georgia, serif",
      bodyFont: "'EB Garamond', Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  neutral: {
    name: "Neutral",
    theme: {
      primaryColor: "#8b6f47",
      secondaryColor: "#c4a47c",
      backgroundColor: "#f5efe6",
      surfaceColor: "#faf6ef",
      primaryTextColor: "#3d2b1f",
      secondaryTextColor: "#8b7355",
      headingFont: "'Cardo', Georgia, serif",
      bodyFont: "'Cardo', Georgia, serif",
      fontScale: "md",
      buttonStyle: "soft",
      buttonSize: "md",
      cornerRadius: 6,
      bgType: "solid",
    },
  },
  dark: {
    name: "Dark",
    theme: {
      primaryColor: "#3b82f6",
      secondaryColor: "#1e40af",
      backgroundColor: "#0f172a",
      surfaceColor: "#1e293b",
      primaryTextColor: "#f1f5f9",
      secondaryTextColor: "#94a3b8",
      headingFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
      fontScale: "md",
      buttonStyle: "rounded",
      buttonSize: "md",
      cornerRadius: 8,
      bgType: "solid",
    },
  },
  editorial: {
    name: "Editorial",
    theme: {
      primaryColor: "#111111",
      secondaryColor: "#9ca3af",
      backgroundColor: "#ffffff",
      surfaceColor: "#fafafa",
      primaryTextColor: "#111111",
      secondaryTextColor: "#6b7280",
      headingFont: "'Great Vibes', cursive",
      bodyFont: "'Lora', Georgia, serif",
      fontScale: "md",
      buttonStyle: "square",
      buttonSize: "md",
      cornerRadius: 0,
      bgType: "solid",
    },
  },
};

// --- Font options ---

export const RICH_FONT_OPTIONS: string[] = [
  "Georgia, serif",
  "'Playfair Display', Georgia, serif",
  "'Cormorant Garamond', Georgia, serif",
  "'Lora', Georgia, serif",
  "'EB Garamond', Georgia, serif",
  "'Cardo', Georgia, serif",
  "'Bodoni Moda', Georgia, serif",
  "Montserrat, system-ui, sans-serif",
  "Inter, system-ui, sans-serif",
  "'Caveat', cursive",
  "'Dancing Script', cursive",
  "'Great Vibes', cursive",
];

export const HEADING_FONT_OPTIONS: string[] = RICH_FONT_OPTIONS;

// --- CSS vars mapping ---

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
  if (theme.bgImage) vars["--event-bg-image"] = `url(${theme.bgImage})`;
  if (theme.bgImagePosition) vars["--event-bg-image-position"] = theme.bgImagePosition;
  if (theme.bgOverlayOpacity !== undefined)
    vars["--event-bg-overlay-opacity"] = String(theme.bgOverlayOpacity);
  return vars;
}

// --- Slug helpers ---

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

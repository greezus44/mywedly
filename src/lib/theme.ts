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
};

export const RUSTY_THEME: ThemeConfig = {
  bg: "#f5f0e8",
  surface: "#faf6f0",
  surfaceAlt: "rgba(250,246,240,0.6)",
  border: "#d4c4a8",
  text: "#4a3728",
  heading: "#3d2b1c",
  muted: "#7a6650",
  primary: "#8b6f47",
  primaryHover: "#7a5f3d",
  primaryFg: "#ffffff",
  accent: "#a67c52",
  fontHeading: "Georgia, serif",
  fontBody: "Georgia, serif",
  fontRich: "Georgia, serif",
};

export const THEME_PRESETS: Record<string, { name: string; theme: ThemeConfig }> = {
  default: { name: "Warm Amber", theme: DEFAULT_THEME },
  rusty: { name: "Rustic Kraft", theme: RUSTY_THEME },
  midnight: {
    name: "Midnight Blue",
    theme: {
      bg: "#0f172a",
      surface: "#1e293b",
      surfaceAlt: "rgba(30,41,59,0.6)",
      border: "#334155",
      text: "#cbd5e1",
      heading: "#f1f5f9",
      muted: "#94a3b8",
      primary: "#3b82f6",
      primaryHover: "#2563eb",
      primaryFg: "#ffffff",
      accent: "#60a5fa",
      fontHeading: "Georgia, serif",
      fontBody: "Georgia, serif",
      fontRich: "Georgia, serif",
    },
  },
  blush: {
    name: "Blush Rose",
    theme: {
      bg: "#fef2f2",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.6)",
      border: "#fecdd3",
      text: "#881337",
      heading: "#881337",
      muted: "#be123c",
      primary: "#e11d48",
      primaryHover: "#be123c",
      primaryFg: "#ffffff",
      accent: "#f43f5e",
      fontHeading: "Playfair Display, serif",
      fontBody: "Lora, serif",
      fontRich: "Lora, serif",
    },
  },
  forest: {
    name: "Forest Green",
    theme: {
      bg: "#f0fdf4",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.6)",
      border: "#bbf7d0",
      text: "#14532d",
      heading: "#14532d",
      muted: "#166534",
      primary: "#16a34a",
      primaryHover: "#15803d",
      primaryFg: "#ffffff",
      accent: "#22c55e",
      fontHeading: "Cormorant Garamond, serif",
      fontBody: "Cardo, serif",
      fontRich: "Cardo, serif",
    },
  },
  ocean: {
    name: "Ocean Breeze",
    theme: {
      bg: "#f0f9ff",
      surface: "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.6)",
      border: "#bae6fd",
      text: "#0c4a6e",
      heading: "#0c4a6e",
      muted: "#0369a1",
      primary: "#0284c7",
      primaryHover: "#0369a1",
      primaryFg: "#ffffff",
      accent: "#38bdf8",
      fontHeading: "Montserrat, sans-serif",
      fontBody: "Montserrat, sans-serif",
      fontRich: "Montserrat, sans-serif",
    },
  },
};

export const RICH_FONT_OPTIONS = [
  { label: "Georgia (Serif)", value: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Lora", value: "Lora, serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Cardo", value: "Cardo, serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif" },
  { label: "Montserrat (Sans)", value: "Montserrat, sans-serif" },
  { label: "Inter (Sans)", value: "Inter, sans-serif" },
  { label: "Caveat (Script)", value: "Caveat, cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
];

export const HEADING_FONT_OPTIONS = RICH_FONT_OPTIONS;

export function themeToEventCssVars(theme: ThemeConfig): Record<string, string> {
  return {
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
  };
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

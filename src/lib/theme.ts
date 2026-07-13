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
  bg: "#1c1917",
  surface: "#292524",
  surfaceAlt: "rgba(255,255,255,0.05)",
  border: "#44403c",
  text: "#f5f5f4",
  heading: "#fbbf24",
  muted: "#a8a29e",
  primary: "#d97706",
  primaryHover: "#b45309",
  primaryFg: "#1c1917",
  accent: "#f59e0b",
  fontHeading: "Playfair Display, Georgia, serif",
  fontBody: "Georgia, serif",
  fontRich: "Georgia, serif",
};

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  default: DEFAULT_THEME,
  rusty: RUSTY_THEME,
  midnight: {
    bg: "#0f172a",
    surface: "#1e293b",
    surfaceAlt: "rgba(255,255,255,0.05)",
    border: "#334155",
    text: "#e2e8f0",
    heading: "#c7d2fe",
    muted: "#94a3b8",
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    primaryFg: "#ffffff",
    accent: "#818cf8",
    fontHeading: "Playfair Display, Georgia, serif",
    fontBody: "Inter, system-ui, sans-serif",
    fontRich: "Georgia, serif",
  },
  blush: {
    bg: "#fdf2f8",
    surface: "#ffffff",
    surfaceAlt: "rgba(255,255,255,0.08)",
    border: "#fbcfe8",
    text: "#831843",
    heading: "#9d174d",
    muted: "#be185d",
    primary: "#db2777",
    primaryHover: "#be185d",
    primaryFg: "#ffffff",
    accent: "#ec4899",
    fontHeading: "Cormorant Garamond, Georgia, serif",
    fontBody: "Georgia, serif",
    fontRich: "Georgia, serif",
  },
  forest: {
    bg: "#f0fdf4",
    surface: "#ffffff",
    surfaceAlt: "rgba(255,255,255,0.08)",
    border: "#bbf7d0",
    text: "#14532d",
    heading: "#166534",
    muted: "#15803d",
    primary: "#16a34a",
    primaryHover: "#15803d",
    primaryFg: "#ffffff",
    accent: "#22c55e",
    fontHeading: "Playfair Display, Georgia, serif",
    fontBody: "Georgia, serif",
    fontRich: "Georgia, serif",
  },
  ocean: {
    bg: "#f0f9ff",
    surface: "#ffffff",
    surfaceAlt: "rgba(255,255,255,0.08)",
    border: "#bae6fd",
    text: "#0c4a6e",
    heading: "#075985",
    muted: "#0369a1",
    primary: "#0284c7",
    primaryHover: "#0369a1",
    primaryFg: "#ffffff",
    accent: "#0ea5e9",
    fontHeading: "Playfair Display, Georgia, serif",
    fontBody: "Inter, system-ui, sans-serif",
    fontRich: "Georgia, serif",
  },
};

export const RICH_FONT_OPTIONS = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Playfair Display", value: "Playfair Display, Georgia, serif" },
  { label: "Cormorant Garamond", value: "Cormorant Garamond, Georgia, serif" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif" },
  { label: "Lora", value: "Lora, Georgia, serif" },
  { label: "Inter (sans)", value: "Inter, system-ui, sans-serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
];

export const HEADING_FONT_OPTIONS = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Playfair Display", value: "Playfair Display, Georgia, serif" },
  { label: "Cormorant Garamond", value: "Cormorant Garamond, Georgia, serif" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif" },
  { label: "Lora", value: "Lora, Georgia, serif" },
  { label: "Inter (sans)", value: "Inter, system-ui, sans-serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
];

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

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

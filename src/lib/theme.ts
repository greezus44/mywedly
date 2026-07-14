export interface ThemeConfig {
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  buttonRadius: string;
  buttonStyle: string;
}

export const DEFAULT_THEME: ThemeConfig = {
  primary: "#8B7355",
  primaryHover: "#75604A",
  secondary: "#D4C5B0",
  secondaryHover: "#C4B5A0",
  accent: "#C99A3B",
  background: "#FAF8F5",
  surface: "#FFFFFF",
  text: "#2D2D2D",
  textMuted: "#6B6B6B",
  border: "#E5E0D8",
  headingFont: "Playfair Display, serif",
  bodyFont: "Inter, sans-serif",
  buttonRadius: "8px",
  buttonStyle: "solid",
};

export function jsonToTheme(json: Record<string, unknown> | null): ThemeConfig {
  if (!json) return { ...DEFAULT_THEME };
  return {
    primary: (json.primary as string) ?? DEFAULT_THEME.primary,
    primaryHover: (json.primaryHover as string) ?? DEFAULT_THEME.primaryHover,
    secondary: (json.secondary as string) ?? DEFAULT_THEME.secondary,
    secondaryHover: (json.secondaryHover as string) ?? DEFAULT_THEME.secondaryHover,
    accent: (json.accent as string) ?? DEFAULT_THEME.accent,
    background: (json.background as string) ?? DEFAULT_THEME.background,
    surface: (json.surface as string) ?? DEFAULT_THEME.surface,
    text: (json.text as string) ?? DEFAULT_THEME.text,
    textMuted: (json.textMuted as string) ?? DEFAULT_THEME.textMuted,
    border: (json.border as string) ?? DEFAULT_THEME.border,
    headingFont: (json.headingFont as string) ?? DEFAULT_THEME.headingFont,
    bodyFont: (json.bodyFont as string) ?? DEFAULT_THEME.bodyFont,
    buttonRadius: (json.buttonRadius as string) ?? DEFAULT_THEME.buttonRadius,
    buttonStyle: (json.buttonStyle as string) ?? DEFAULT_THEME.buttonStyle,
  };
}

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--event-primary": theme.primary,
    "--event-primary-hover": theme.primaryHover,
    "--event-secondary": theme.secondary,
    "--event-secondary-hover": theme.secondaryHover,
    "--event-accent": theme.accent,
    "--event-bg": theme.background,
    "--event-surface": theme.surface,
    "--event-text": theme.text,
    "--event-text-muted": theme.textMuted,
    "--event-border": theme.border,
    "--event-heading-font": theme.headingFont,
    "--event-body-font": theme.bodyFont,
    "--event-button-radius": theme.buttonRadius,
  };
}

export function themeToEventCssVars(theme: ThemeConfig): React.CSSProperties {
  return themeToCssVars(theme) as React.CSSProperties;
}

export const HEADING_FONT_OPTIONS = [
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Cinzel", value: "'Cinzel', serif" },
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Lora", value: "'Lora', serif" },
];

export const RICH_FONT_OPTIONS = [
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Raleway", value: "'Raleway', sans-serif" },
];

export interface ThemePreset {
  name: string;
  theme: Partial<ThemeConfig>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Rustic",
    theme: {
      primary: "#8B7355",
      primaryHover: "#75604A",
      secondary: "#D4C5B0",
      secondaryHover: "#C4B5A0",
      accent: "#C99A3B",
      background: "#FAF8F5",
      surface: "#FFFFFF",
      text: "#2D2D2D",
      textMuted: "#6B6B6B",
      border: "#E5E0D8",
    },
  },
  {
    name: "Blush",
    theme: {
      primary: "#C4756B",
      primaryHover: "#B0655B",
      secondary: "#F5E6E0",
      secondaryHover: "#E8D5CE",
      accent: "#D4A5A5",
      background: "#FDF8F6",
      surface: "#FFFFFF",
      text: "#3D2D2D",
      textMuted: "#8B7570",
      border: "#F0E0DA",
    },
  },
  {
    name: "Sage",
    theme: {
      primary: "#6B8E6B",
      primaryHover: "#5A7A5A",
      secondary: "#D4E4D4",
      secondaryHover: "#C4D4C4",
      accent: "#8FAB8F",
      background: "#F8FAF8",
      surface: "#FFFFFF",
      text: "#2D3D2D",
      textMuted: "#6B7B6B",
      border: "#E0E8E0",
    },
  },
  {
    name: "Navy",
    theme: {
      primary: "#2C3E50",
      primaryHover: "#1A2A3A",
      secondary: "#D6DBE0",
      secondaryHover: "#C6CBD0",
      accent: "#C0A06B",
      background: "#F8F9FA",
      surface: "#FFFFFF",
      text: "#1A1A1A",
      textMuted: "#6B6B6B",
      border: "#E0E0E0",
    },
  },
  {
    name: "Charcoal",
    theme: {
      primary: "#3D3D3D",
      primaryHover: "#2D2D2D",
      secondary: "#E8E8E8",
      secondaryHover: "#D8D8D8",
      accent: "#A0826D",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      text: "#1A1A1A",
      textMuted: "#6B6B6B",
      border: "#E5E5E5",
    },
  },
];

export const RUSTY_THEME: ThemeConfig = {
  ...DEFAULT_THEME,
  primary: "#8B7355",
  primaryHover: "#75604A",
  secondary: "#D4C5B0",
  secondaryHover: "#C4B5A0",
  accent: "#C99A3B",
  background: "#FAF8F5",
  surface: "#FFFFFF",
  text: "#2D2D2D",
  textMuted: "#6B6B6B",
  border: "#E5E0D8",
};

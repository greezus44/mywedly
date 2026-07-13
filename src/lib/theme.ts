import type { ThemeConfig, WeddingContent } from "./supabase";

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: "#b8973a",
    primaryLight: "#d4b85c",
    primaryDark: "#8a6f28",
    background: "#f5edda",
    backgroundLight: "#faf5e8",
    surface: "#ffffff",
    text: "#2a2a2a",
    textMuted: "#8a8a8a",
    border: "#b8973a",
    accent: "#c9a0a0",
    success: "#8a9a7b",
    warning: "#d4b85c",
    error: "#c97070",
  },
  typography: {
    scriptFont: "Playfair Display",
    headingFont: "Cormorant Garamond",
    bodyFont: "Cormorant Garamond",
    uiFont: "Jost",
    scriptSize: "3rem",
    headingSize: "1.5rem",
    bodySize: "1.0625rem",
    letterSpacing: "0.15em",
  },
  ui: {
    radius: "8px",
    buttonRadius: "8px",
    buttonStyle: "outline",
  },
};

export const THEME_PRESETS: { name: string; config: ThemeConfig }[] = [
  { name: "Classic Gold", config: DEFAULT_THEME },
  {
    name: "Elegant White",
    config: {
      colors: { ...DEFAULT_THEME.colors!, background: "#ffffff", backgroundLight: "#fafafa", surface: "#ffffff", text: "#1a1a1a", border: "#c0c0c0", primary: "#888888", primaryLight: "#aaaaaa", primaryDark: "#666666" },
      typography: { ...DEFAULT_THEME.typography! },
      ui: { ...DEFAULT_THEME.ui! },
    },
  },
  {
    name: "Sage Green",
    config: {
      colors: { ...DEFAULT_THEME.colors!, background: "#f0f4ec", backgroundLight: "#f7f9f3", primary: "#7a8b6f", primaryLight: "#9aab8e", primaryDark: "#5a6b4f", border: "#7a8b6f" },
      typography: { ...DEFAULT_THEME.typography! },
      ui: { ...DEFAULT_THEME.ui! },
    },
  },
  {
    name: "Dusty Blue",
    config: {
      colors: { ...DEFAULT_THEME.colors!, background: "#eef2f5", backgroundLight: "#f5f8fa", primary: "#7a9ab8", primaryLight: "#9ab4cc", primaryDark: "#5a7a98", border: "#7a9ab8" },
      typography: { ...DEFAULT_THEME.typography! },
      ui: { ...DEFAULT_THEME.ui! },
    },
  },
  {
    name: "Blush Pink",
    config: {
      colors: { ...DEFAULT_THEME.colors!, background: "#faf0f0", backgroundLight: "#fdf5f5", primary: "#c9a0a0", primaryLight: "#dab5b5", primaryDark: "#a98080", border: "#c9a0a0" },
      typography: { ...DEFAULT_THEME.typography! },
      ui: { ...DEFAULT_THEME.ui! },
    },
  },
  {
    name: "Terracotta",
    config: {
      colors: { ...DEFAULT_THEME.colors!, background: "#f5ede6", backgroundLight: "#faf5f0", primary: "#c08060", primaryLight: "#d49a7a", primaryDark: "#a06040", border: "#c08060" },
      typography: { ...DEFAULT_THEME.typography! },
      ui: { ...DEFAULT_THEME.ui! },
    },
  },
  {
    name: "Modern Black",
    config: {
      colors: { ...DEFAULT_THEME.colors!, background: "#1a1a1a", backgroundLight: "#2a2a2a", surface: "#222222", text: "#f0f0f0", textMuted: "#999999", primary: "#d4af37", primaryLight: "#e8c55c", primaryDark: "#b8973a", border: "#d4af37" },
      typography: { ...DEFAULT_THEME.typography! },
      ui: { ...DEFAULT_THEME.ui! },
    },
  },
  {
    name: "Champagne",
    config: {
      colors: { ...DEFAULT_THEME.colors!, background: "#f7f0e6", backgroundLight: "#fcf7ef", primary: "#c4a878", primaryLight: "#d8be98", primaryDark: "#a48858", border: "#c4a878" },
      typography: { ...DEFAULT_THEME.typography! },
      ui: { ...DEFAULT_THEME.ui! },
    },
  },
  {
    name: "Garden Wedding",
    config: {
      colors: { ...DEFAULT_THEME.colors!, background: "#f3f0e8", backgroundLight: "#f9f7f2", primary: "#6b8e6b", primaryLight: "#8aab8a", primaryDark: "#4b6e4b", border: "#6b8e6b" },
      typography: { ...DEFAULT_THEME.typography! },
      ui: { ...DEFAULT_THEME.ui! },
    },
  },
  {
    name: "Minimal Mono",
    config: {
      colors: { ...DEFAULT_THEME.colors!, background: "#fafafa", backgroundLight: "#ffffff", primary: "#1a1a1a", primaryLight: "#444444", primaryDark: "#000000", border: "#1a1a1a" },
      typography: { ...DEFAULT_THEME.typography! },
      ui: { ...DEFAULT_THEME.ui! },
    },
  },
];

export function themeToCssVars(theme: ThemeConfig | null | undefined): Record<string, string> {
  const t = theme || DEFAULT_THEME;
  const c = t.colors || {};
  const ty = t.typography || {};
  const u = t.ui || {};
  return {
    "--color-primary": c.primary || DEFAULT_THEME.colors!.primary!,
    "--color-primary-light": c.primaryLight || DEFAULT_THEME.colors!.primaryLight!,
    "--color-primary-dark": c.primaryDark || DEFAULT_THEME.colors!.primaryDark!,
    "--color-bg": c.background || DEFAULT_THEME.colors!.background!,
    "--color-bg-light": c.backgroundLight || DEFAULT_THEME.colors!.backgroundLight!,
    "--color-surface": c.surface || DEFAULT_THEME.colors!.surface!,
    "--color-text": c.text || DEFAULT_THEME.colors!.text!,
    "--color-text-muted": c.textMuted || DEFAULT_THEME.colors!.textMuted!,
    "--color-border": c.border || DEFAULT_THEME.colors!.border!,
    "--color-accent": c.accent || DEFAULT_THEME.colors!.accent!,
    "--color-success": c.success || DEFAULT_THEME.colors!.success!,
    "--color-warning": c.warning || DEFAULT_THEME.colors!.warning!,
    "--color-error": c.error || DEFAULT_THEME.colors!.error!,
    "--font-script": `"${ty.scriptFont || "Playfair Display"}", serif`,
    "--font-heading": `"${ty.headingFont || "Cormorant Garamond"}", serif`,
    "--font-body": `"${ty.bodyFont || "Cormorant Garamond"}", serif`,
    "--font-ui": `"${ty.uiFont || "Jost"}", sans-serif`,
    "--radius": u.radius || "8px",
    "--button-radius": u.buttonRadius || "8px",
  };
}

export function applyThemeToElement(el: HTMLElement | null, theme: ThemeConfig | null | undefined) {
  if (!el) return;
  const vars = themeToCssVars(theme);
  Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
}

export function getTheme(wedding: { theme_config?: ThemeConfig | Record<string, never> } | null): ThemeConfig {
  if (wedding?.theme_config && "colors" in wedding.theme_config) return wedding.theme_config as ThemeConfig;
  return DEFAULT_THEME;
}

export function getDraftTheme(wedding: { theme_config?: ThemeConfig | Record<string, never>; draft_theme_config?: ThemeConfig | null } | null): ThemeConfig {
  if (wedding?.draft_theme_config && "colors" in wedding.draft_theme_config) return wedding.draft_theme_config;
  return getTheme(wedding);
}

export function getCoverContent(wedding: { content?: WeddingContent | Record<string, never>; draft_content?: WeddingContent | Record<string, never> | null }): WeddingContent {
  const pub = (wedding.content || {}) as WeddingContent;
  const draft = (wedding.draft_content || {}) as WeddingContent;
  return { ...pub, ...draft };
}

export function getContent(wedding: { content?: WeddingContent | Record<string, never>; draft_content?: WeddingContent | Record<string, never> | null }, useDraft = false): WeddingContent {
  const pub = (wedding.content || {}) as WeddingContent;
  if (useDraft && wedding.draft_content) {
    const draft = (wedding.draft_content || {}) as WeddingContent;
    return { ...pub, ...draft };
  }
  return pub;
}

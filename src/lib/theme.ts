import type { CoverContent } from "@/lib/supabase";

export type ThemeConfig = {
  colors: {
    primary: string; secondary: string; accent: string; background: string;
    card: string; button: string; buttonText: string; link: string;
    text: string; textMuted: string; navBg: string; navText: string;
    footerBg: string; footerText: string;
  };
  typography: {
    headingFont: string; bodyFont: string; headingSize: string;
    bodySize: string; headingWeight: string; bodyWeight: string;
    fontStyle: "normal" | "italic";
  };
  ui: {
    borderRadius: string; shadowIntensity: "none" | "soft" | "medium" | "strong";
    sectionSpacing: string;
  };
  preset?: string;
};

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: "#8c7e6a", secondary: "#c4b8a8", accent: "#b8a06a",
    background: "#fdfcf9", card: "#ffffff", button: "#1a1a1a", buttonText: "#fdfcf9",
    link: "#8c7e6a", text: "#1a1a1a", textMuted: "#8c7e6a",
    navBg: "#fdfcf9", navText: "#1a1a1a", footerBg: "#1a1a1a", footerText: "#fdfcf9",
  },
  typography: {
    headingFont: "Cormorant Garamond", bodyFont: "Inter",
    headingSize: "1rem", bodySize: "1rem", headingWeight: "500", bodyWeight: "400", fontStyle: "normal",
  },
  ui: { borderRadius: "0.5rem", shadowIntensity: "soft", sectionSpacing: "4rem" },
  preset: "classic-white",
};

export const THEME_PRESETS: { key: string; name: string; theme: ThemeConfig }[] = [
  { key: "classic-white", name: "Classic White", theme: { ...DEFAULT_THEME, preset: "classic-white" } },
  {
    key: "elegant-gold", name: "Elegant Gold", theme: {
      colors: { primary: "#b8a06a", secondary: "#d4c4a8", accent: "#8a6b2a", background: "#f6efdd", card: "#fffdf5", button: "#8a6b2a", buttonText: "#fffdf5", link: "#8a6b2a", text: "#2a2a2a", textMuted: "#8a6b2a", navBg: "#f6efdd", navText: "#2a2a2a", footerBg: "#2a2a2a", footerText: "#f6efdd" },
      typography: { headingFont: "Playfair Display", bodyFont: "Lora", headingSize: "1rem", bodySize: "1rem", headingWeight: "500", bodyWeight: "400", fontStyle: "normal" },
      ui: { borderRadius: "0.25rem", shadowIntensity: "soft", sectionSpacing: "4rem" }, preset: "elegant-gold",
    },
  },
  {
    key: "sage-green", name: "Sage Green", theme: {
      colors: { primary: "#3f5d3a", secondary: "#7a8a72", accent: "#5a7a4a", background: "#ecefe4", card: "#f5f7f0", button: "#3f5d3a", buttonText: "#ecefe4", link: "#3f5d3a", text: "#2a3a2a", textMuted: "#5a7a5a", navBg: "#ecefe4", navText: "#2a3a2a", footerBg: "#2a3a2a", footerText: "#ecefe4" },
      typography: { headingFont: "Cormorant Garamond", bodyFont: "Inter", headingSize: "1rem", bodySize: "1rem", headingWeight: "500", bodyWeight: "400", fontStyle: "normal" },
      ui: { borderRadius: "0.75rem", shadowIntensity: "soft", sectionSpacing: "4rem" }, preset: "sage-green",
    },
  },
  {
    key: "dusty-blue", name: "Dusty Blue", theme: {
      colors: { primary: "#2e4a63", secondary: "#6a8aaa", accent: "#4a6a8a", background: "#eff4f8", card: "#f8fbfd", button: "#2e4a63", buttonText: "#eff4f8", link: "#2e4a63", text: "#1a2a3a", textMuted: "#5a7a9a", navBg: "#eff4f8", navText: "#1a2a3a", footerBg: "#1a2a3a", footerText: "#eff4f8" },
      typography: { headingFont: "Playfair Display", bodyFont: "Open Sans", headingSize: "1rem", bodySize: "1rem", headingWeight: "500", bodyWeight: "400", fontStyle: "normal" },
      ui: { borderRadius: "0.5rem", shadowIntensity: "soft", sectionSpacing: "4rem" }, preset: "dusty-blue",
    },
  },
  {
    key: "blush-pink", name: "Blush Pink", theme: {
      colors: { primary: "#a0475a", secondary: "#d4a0a8", accent: "#c4a0a0", background: "#faeef0", card: "#fff5f6", button: "#a0475a", buttonText: "#faeef0", link: "#a0475a", text: "#3a2a2a", textMuted: "#a0475a", navBg: "#faeef0", navText: "#3a2a2a", footerBg: "#3a2a2a", footerText: "#faeef0" },
      typography: { headingFont: "Cormorant Garamond", bodyFont: "Montserrat", headingSize: "1rem", bodySize: "1rem", headingWeight: "500", bodyWeight: "400", fontStyle: "normal" },
      ui: { borderRadius: "0.75rem", shadowIntensity: "soft", sectionSpacing: "4rem" }, preset: "blush-pink",
    },
  },
  {
    key: "terracotta", name: "Terracotta", theme: {
      colors: { primary: "#a04a2a", secondary: "#c48a6a", accent: "#b86a4a", background: "#f6ece0", card: "#fdf6ef", button: "#a04a2a", buttonText: "#f6ece0", link: "#a04a2a", text: "#3a2a1a", textMuted: "#a04a2a", navBg: "#f6ece0", navText: "#3a2a1a", footerBg: "#3a2a1a", footerText: "#f6ece0" },
      typography: { headingFont: "Playfair Display", bodyFont: "Inter", headingSize: "1rem", bodySize: "1rem", headingWeight: "500", bodyWeight: "400", fontStyle: "normal" },
      ui: { borderRadius: "0.5rem", shadowIntensity: "medium", sectionSpacing: "4rem" }, preset: "terracotta",
    },
  },
  {
    key: "modern-black", name: "Modern Black", theme: {
      colors: { primary: "#e6dfd0", secondary: "#a0a0a0", accent: "#c4b8a8", background: "#12141a", card: "#1a1d26", button: "#e6dfd0", buttonText: "#12141a", link: "#e6dfd0", text: "#e6dfd0", textMuted: "#8a8a8a", navBg: "#12141a", navText: "#e6dfd0", footerBg: "#0a0b0f", footerText: "#8a8a8a" },
      typography: { headingFont: "Playfair Display", bodyFont: "Inter", headingSize: "1rem", bodySize: "1rem", headingWeight: "500", bodyWeight: "300", fontStyle: "normal" },
      ui: { borderRadius: "0.375rem", shadowIntensity: "medium", sectionSpacing: "5rem" }, preset: "modern-black",
    },
  },
  {
    key: "champagne", name: "Champagne", theme: {
      colors: { primary: "#a88a5a", secondary: "#d4c4a8", accent: "#c4a878", background: "#f8f4ea", card: "#fdfaf2", button: "#a88a5a", buttonText: "#f8f4ea", link: "#a88a5a", text: "#3a3a2a", textMuted: "#a88a5a", navBg: "#f8f4ea", navText: "#3a3a2a", footerBg: "#3a3a2a", footerText: "#f8f4ea" },
      typography: { headingFont: "Cormorant Garamond", bodyFont: "Lora", headingSize: "1rem", bodySize: "1rem", headingWeight: "500", bodyWeight: "400", fontStyle: "italic" },
      ui: { borderRadius: "0.5rem", shadowIntensity: "soft", sectionSpacing: "4rem" }, preset: "champagne",
    },
  },
  {
    key: "garden-wedding", name: "Garden Wedding", theme: {
      colors: { primary: "#4a7a3a", secondary: "#8aaa7a", accent: "#6a9a5a", background: "#f0f5ea", card: "#f8fbf2", button: "#4a7a3a", buttonText: "#f0f5ea", link: "#4a7a3a", text: "#2a3a2a", textMuted: "#6a8a5a", navBg: "#f0f5ea", navText: "#2a3a2a", footerBg: "#2a3a2a", footerText: "#f0f5ea" },
      typography: { headingFont: "Cormorant Garamond", bodyFont: "Montserrat", headingSize: "1rem", bodySize: "1rem", headingWeight: "500", bodyWeight: "400", fontStyle: "normal" },
      ui: { borderRadius: "1rem", shadowIntensity: "soft", sectionSpacing: "5rem" }, preset: "garden-wedding",
    },
  },
  {
    key: "minimal-monochrome", name: "Minimal Monochrome", theme: {
      colors: { primary: "#2a2a2a", secondary: "#8a8a8a", accent: "#4a4a4a", background: "#ffffff", card: "#fafafa", button: "#2a2a2a", buttonText: "#ffffff", link: "#2a2a2a", text: "#1a1a1a", textMuted: "#8a8a8a", navBg: "#ffffff", navText: "#1a1a1a", footerBg: "#1a1a1a", footerText: "#ffffff" },
      typography: { headingFont: "Inter", bodyFont: "Inter", headingSize: "1rem", bodySize: "1rem", headingWeight: "600", bodyWeight: "400", fontStyle: "normal" },
      ui: { borderRadius: "0.25rem", shadowIntensity: "none", sectionSpacing: "3rem" }, preset: "minimal-monochrome",
    },
  },
];

export const FONT_OPTIONS = [
  "Cormorant Garamond", "Playfair Display", "Inter", "Lora", "Montserrat",
  "Open Sans", "Merriweather", "Poppins", "Dancing Script", "Great Vibes",
  "Imperial Script", "EB Garamond", "Cinzel", "Marcellus", "Cardo",
  "Libre Baskerville", "Sacramento", "Parisienne", "Caveat", "Allura", "Tangerine",
];

export const SHADOW_MAP: Record<string, string> = {
  none: "none",
  soft: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  medium: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
  strong: "0 12px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
};

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  const v: Record<string, string> = {};
  for (const [k, val] of Object.entries(theme.colors)) v[`--c-${k}`] = val;
  v["--f-heading"] = `"${theme.typography.headingFont}", serif`;
  v["--f-body"] = `"${theme.typography.bodyFont}", sans-serif`;
  v["--f-style"] = theme.typography.fontStyle;
  v["--ui-radius"] = theme.ui.borderRadius;
  v["--ui-shadow"] = SHADOW_MAP[theme.ui.shadowIntensity] ?? SHADOW_MAP.soft;
  v["--ui-spacing"] = theme.ui.sectionSpacing;
  return v;
}

export function getTheme(wedding: { theme_config?: Record<string, unknown> | null } | null): ThemeConfig {
  if (!wedding?.theme_config) return DEFAULT_THEME;
  const tc = wedding.theme_config as Record<string, unknown>;
  if (!tc || Object.keys(tc).length === 0) return DEFAULT_THEME;
  return {
    colors: { ...DEFAULT_THEME.colors, ...((tc.colors as Record<string, string>) ?? {}) },
    typography: { ...DEFAULT_THEME.typography, ...((tc.typography as Record<string, unknown>) ?? {}) } as ThemeConfig["typography"],
    ui: { ...DEFAULT_THEME.ui, ...((tc.ui as Record<string, unknown>) ?? {}) } as ThemeConfig["ui"],
    preset: (tc.preset as string) ?? undefined,
  };
}

export function getDraftTheme(wedding: { draft_theme_config?: Record<string, unknown> | null; theme_config?: Record<string, unknown> | null } | null): ThemeConfig {
  const draft = wedding?.draft_theme_config;
  if (!draft || Object.keys(draft).length === 0) return getTheme(wedding);
  return {
    colors: { ...DEFAULT_THEME.colors, ...((draft.colors as Record<string, string>) ?? {}) },
    typography: { ...DEFAULT_THEME.typography, ...((draft.typography as Record<string, unknown>) ?? {}) } as ThemeConfig["typography"],
    ui: { ...DEFAULT_THEME.ui, ...((draft.ui as Record<string, unknown>) ?? {}) } as ThemeConfig["ui"],
    preset: (draft.preset as string) ?? undefined,
  };
}

export function getCoverContent(wedding: { draft_content?: Record<string, unknown> | null; content?: Record<string, unknown> | null } | null): CoverContent {
  const draft = wedding?.draft_content;
  const published = wedding?.content;
  return { ...(published as CoverContent ?? {}), ...((draft ?? {}) as CoverContent) };
}

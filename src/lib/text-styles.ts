import type { CSSProperties } from "react";
import type { TextStyle, TypographySettings, WeddingContent } from "./supabase";

export const FONT_OPTIONS = [
  { name: "Imperial Script", fallback: "cursive", category: "script" },
  { name: "Inter", fallback: "system-ui, sans-serif", category: "sans" },
  { name: "Playfair Display", fallback: "Georgia, serif", category: "serif" },
  { name: "Poppins", fallback: "system-ui, sans-serif", category: "sans" },
  { name: "Montserrat", fallback: "system-ui, sans-serif", category: "sans" },
  { name: "Lora", fallback: "Georgia, serif", category: "serif" },
  { name: "Open Sans", fallback: "system-ui, sans-serif", category: "sans" },
  { name: "Merriweather", fallback: "Georgia, serif", category: "serif" },
  { name: "Dancing Script", fallback: "cursive", category: "script" },
  { name: "Great Vibes", fallback: "cursive", category: "script" },
  { name: "Cormorant Garamond", fallback: "Georgia, serif", category: "serif" },
  { name: "EB Garamond", fallback: "Georgia, serif", category: "serif" },
  { name: "Cinzel", fallback: "Georgia, serif", category: "serif" },
  { name: "Marcellus", fallback: "Georgia, serif", category: "serif" },
  { name: "Cardo", fallback: "Georgia, serif", category: "serif" },
  { name: "Libre Baskerville", fallback: "Georgia, serif", category: "serif" },
  { name: "Sacramento", fallback: "cursive", category: "script" },
  { name: "Parisienne", fallback: "cursive", category: "script" },
  { name: "Caveat", fallback: "cursive", category: "script" },
  { name: "Allura", fallback: "cursive", category: "script" },
  { name: "Tangerine", fallback: "cursive", category: "script" },
];

export const FONT_WEIGHTS = [
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "700" },
];

export const TEXT_TRANSFORMS = [
  { label: "None", value: "none" },
  { label: "UPPERCASE", value: "uppercase" },
  { label: "lowercase", value: "lowercase" },
  { label: "Capitalize", value: "capitalize" },
];

export const TEXT_ALIGNS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
  { label: "Justify", value: "justify" },
];

export const THEME_PRESETS = [
  { name: "Sepia (default)", accent: "#8c7e6a", bg: "#fdfcf9" },
  { name: "Ivory & gold", accent: "#8a6b2a", bg: "#f6efdd" },
  { name: "Deep rose", accent: "#7a2b3a", bg: "#f5ecec" },
  { name: "Midnight & pearl", accent: "#e6dfd0", bg: "#12141a" },
  { name: "Sage garden", accent: "#3f5d3a", bg: "#ecefe4" },
  { name: "Blush petal", accent: "#a0475a", bg: "#faeef0" },
  { name: "Ocean", accent: "#2e4a63", bg: "#eff4f8" },
  { name: "Terracotta", accent: "#a04a2a", bg: "#f6ece0" },
];

export type TextElementDef = {
  key: string;
  label: string;
  group: string;
  defaultStyle?: TextStyle;
};

export const TEXT_ELEMENTS: TextElementDef[] = [
  { group: "Cover Page", key: "cover_heading", label: "Couple Names", defaultStyle: { fontFamily: "Imperial Script", size: "4rem", color: "#1a1a1a", textAlign: "center" } },
  { group: "Cover Page", key: "cover_subtitle", label: "Wedding Date / Subtitle", defaultStyle: { fontFamily: "Inter", size: "0.875rem", weight: "400", color: "#8c7e6a", letterSpacing: "0.35em", textTransform: "uppercase", textAlign: "center" } },
  { group: "Cover Page", key: "cover_welcome", label: "Welcome Message", defaultStyle: { fontFamily: "Cormorant Garamond", fontStyle: "italic", size: "1rem", color: "#8c7e6a", textAlign: "center" } },
  { group: "Cover Page", key: "cover_button", label: "Button Text", defaultStyle: { fontFamily: "Inter", size: "0.75rem", weight: "500", color: "#8c7e6a", letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center" } },
  { group: "Invitation", key: "invitation_parents", label: "Parents", defaultStyle: { fontFamily: "Inter", size: "0.875rem", weight: "400", color: "#8c7e6a", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" } },
  { group: "Invitation", key: "invitation_text", label: "Invitation Text", defaultStyle: { fontFamily: "Cormorant Garamond", fontStyle: "italic", size: "1rem", weight: "400", color: "#2a2a2a", lineHeight: "1.6", textAlign: "center" } },
  { group: "Invitation", key: "invitation_closing", label: "Closing Text", defaultStyle: { fontFamily: "Cormorant Garamond", fontStyle: "italic", size: "1rem", color: "#2a2a2a", lineHeight: "1.6", textAlign: "center" } },
  { group: "Info", key: "info_heading", label: "Section Title", defaultStyle: { fontFamily: "Inter", size: "1.5rem", weight: "500", color: "#8c7e6a", letterSpacing: "0.35em", textTransform: "uppercase", textAlign: "center" } },
  { group: "Info", key: "info_body", label: "Body Text", defaultStyle: { fontFamily: "Inter", size: "0.875rem", weight: "500", color: "#8c7e6a", lineHeight: "2.4", letterSpacing: "0.05em", textAlign: "center" } },
  { group: "Events", key: "events_title", label: "Section Title", defaultStyle: { fontFamily: "Inter", size: "1.5rem", weight: "500", color: "#8c7e6a", letterSpacing: "0.35em", textTransform: "uppercase", textAlign: "center" } },
  { group: "Events", key: "event_name", label: "Event Titles", defaultStyle: { fontFamily: "Cormorant Garamond", size: "1.25rem", weight: "500", color: "#1a1a1a", textAlign: "left" } },
  { group: "Events", key: "event_time", label: "Times", defaultStyle: { fontFamily: "Inter", size: "0.875rem", color: "#8c7e6a", textAlign: "left" } },
  { group: "Events", key: "event_venue", label: "Locations", defaultStyle: { fontFamily: "Inter", size: "0.875rem", color: "#5a5a5a", textAlign: "left" } },
  { group: "Events", key: "event_notes", label: "Event Notes", defaultStyle: { fontFamily: "Inter", fontStyle: "italic", size: "0.875rem", color: "#5a5a5a", textAlign: "left" } },
  { group: "Custom Pages", key: "custom_page_title", label: "Page Title", defaultStyle: { fontFamily: "Inter", size: "1.5rem", weight: "500", color: "#8c7e6a", letterSpacing: "0.3em", textTransform: "uppercase", textAlign: "center" } },
  { group: "Custom Pages", key: "custom_page_body", label: "Page Body", defaultStyle: { fontFamily: "Inter", size: "1rem", color: "#5a5a5a", lineHeight: "2", textAlign: "left" } },
];

export const DEFAULT_GLOBAL_TYPOGRAPHY: TextStyle = {
  fontFamily: "Inter",
  size: "1rem",
  weight: "400",
  fontStyle: "normal",
  color: "#1a1a1a",
  lineHeight: "1.5",
  textAlign: "left",
  textTransform: "none",
  letterSpacing: "normal",
  opacity: "1",
};

export function getTypography(content: WeddingContent): TypographySettings {
  if (content.typography) return content.typography;
  const legacy = (content.text_styles ?? {}) as Record<string, TextStyle>;
  return { global: DEFAULT_GLOBAL_TYPOGRAPHY, elements: { ...legacy } };
}

export function getElementStyle(content: WeddingContent, key: string): TextStyle {
  const typo = getTypography(content);
  const elem = typo.elements[key];
  return { ...typo.global, ...elem };
}

export function styleFor(ts: TextStyle): CSSProperties {
  const s: CSSProperties = {};
  if (ts.fontFamily) {
    const font = FONT_OPTIONS.find((f) => f.name === ts.fontFamily);
    s.fontFamily = font ? `"${ts.fontFamily}", ${font.fallback}` : ts.fontFamily;
  }
  if (ts.size) s.fontSize = ts.size;
  if (ts.weight) s.fontWeight = ts.weight;
  if (ts.fontStyle) s.fontStyle = ts.fontStyle;
  if (ts.color) s.color = ts.color;
  if (ts.letterSpacing) s.letterSpacing = ts.letterSpacing;
  if (ts.lineHeight) s.lineHeight = ts.lineHeight;
  if (ts.textTransform) s.textTransform = ts.textTransform;
  if (ts.textAlign) s.textAlign = ts.textAlign;
  if (ts.textShadow) s.textShadow = ts.textShadow;
  if (ts.opacity) s.opacity = ts.opacity;
  return s;
}

export function styleWithGlobal(content: WeddingContent, key: string): CSSProperties {
  return styleFor(getElementStyle(content, key));
}

export function getStyle(content: Record<string, unknown>, key: string): TextStyle {
  const c = content as unknown as WeddingContent;
  return getElementStyle(c, key);
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

export function contrastRatio(fg: string, bg: string): number | null {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  if (!fgRgb || !bgRgb) return null;
  const l1 = relLuminance(fgRgb);
  const l2 = relLuminance(bgRgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function contrastWarning(fg: string, bg: string): string | null {
  const ratio = contrastRatio(fg, bg);
  if (ratio === null) return null;
  if (ratio < 3) return `Very low contrast (${ratio.toFixed(1)}:1). Text may be unreadable.`;
  if (ratio < 4.5) return `Low contrast (${ratio.toFixed(1)}:1). WCAG AA requires 4.5:1 for normal text.`;
  return null;
}

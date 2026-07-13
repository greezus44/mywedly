import type { CSSProperties } from "react";
import type { TextStyle, WeddingContent } from "./supabase";

export function getStyle(content: Record<string, unknown>, key: string): TextStyle {
  const styles = (content.text_styles ?? {}) as Record<string, TextStyle>;
  return styles[key] ?? {};
}

export function styleFor(ts: TextStyle): CSSProperties {
  const s: CSSProperties = {};
  if (ts.fontFamily) s.fontFamily = ts.fontFamily;
  if (ts.size) s.fontSize = ts.size;
  if (ts.color) s.color = ts.color;
  if (ts.weight) s.fontWeight = ts.weight;
  if (ts.letterSpacing) s.letterSpacing = ts.letterSpacing;
  if (ts.lineHeight) s.lineHeight = ts.lineHeight;
  if (ts.textTransform) s.textTransform = ts.textTransform as CSSProperties["textTransform"];
  if (ts.align) s.textAlign = ts.align as CSSProperties["textAlign"];
  if (ts.italic) s.fontStyle = "italic";
  if (ts.bold) s.fontWeight = "700";
  return s;
}

export const FONT_OPTIONS = [
  "Imperial Script",
  "Cormorant Garamond",
  "Playfair Display",
  "Lora",
  "Montserrat",
  "Inter",
  "Dancing Script",
  "Great Vibes",
  "Sacramento",
  "Parisienne",
  "EB Garamond",
  "Caveat",
  "Allura",
  "Tangerine",
  "Marcellus",
  "Cinzel",
  "Cardo",
  "Libre Baskerville",
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

import type { CSSProperties } from "react";

export type TextStyle = {
  family?: string;
  size?: number;
  color?: string;
  bold?: boolean;
  align?: "left" | "center" | "right";
  weight?: number;
  letterSpacing?: string;
  lineHeight?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
};

export const FONT_OPTIONS = [
  { label: "Inter (Default Sans)", value: "'Inter', sans-serif" },
  { label: "Cormorant Garamond (Serif)", value: "'Cormorant Garamond', serif" },
  { label: "Imperial Script", value: "'Imperial Script', cursive" },
  { label: "Outfit", value: "'Outfit', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Sacramento", value: "'Sacramento', cursive" },
  { label: "Parisienne", value: "'Parisienne', cursive" },
];

export const WEIGHT_OPTIONS = [
  { label: "Light (300)", value: 300 },
  { label: "Regular (400)", value: 400 },
  { label: "Medium (500)", value: 500 },
  { label: "Semi-bold (600)", value: 600 },
  { label: "Bold (700)", value: 700 },
];

export function styleFor(s?: TextStyle | null): CSSProperties {
  if (!s) return {};
  return {
    fontFamily: s.family || undefined,
    fontSize: s.size ? `${s.size}px` : undefined,
    color: s.color || undefined,
    fontWeight: s.weight ?? (s.bold ? 700 : undefined),
    textAlign: s.align,
    letterSpacing: s.letterSpacing,
    lineHeight: s.lineHeight ? `${s.lineHeight}` : undefined,
    textTransform: s.textTransform === "none" ? undefined : s.textTransform,
  };
}

export function getStyle(
  content: Record<string, any> | null | undefined,
  key: string,
): TextStyle | undefined {
  return (content?.styles ?? {})[key];
}

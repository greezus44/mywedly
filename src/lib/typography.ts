import type React from "react";

export interface TypographyStyle {
  text?: string;
  align?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export function isTypographyObject(value: unknown): value is TypographyStyle {
  if (value === null || value === undefined) return false;
  if (typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  if (typeof (value as { $$typeof?: unknown }).$$typeof === "symbol") return false;
  const keys = ["text", "align", "color", "fontSize", "fontFamily", "fontWeight", "lineHeight", "letterSpacing"];
  return keys.some((k) => k in (value as Record<string, unknown>));
}

export function getTypographyText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (isTypographyObject(value)) return value.text ?? fallback;
  return fallback;
}

export function getTypographyStyle(value: unknown): React.CSSProperties {
  if (!isTypographyObject(value)) return {};
  const style: React.CSSProperties = {};
  if (value.fontFamily) style.fontFamily = value.fontFamily;
  if (value.fontSize !== undefined) style.fontSize = `${value.fontSize}px`;
  if (value.fontWeight !== undefined) style.fontWeight = value.fontWeight;
  if (value.color) style.color = value.color;
  if (value.letterSpacing !== undefined) style.letterSpacing = `${value.letterSpacing}em`;
  if (value.lineHeight !== undefined) style.lineHeight = value.lineHeight;
  if (value.align) style.textAlign = value.align as "left" | "center" | "right";
  return style;
}

export function resolveTypography(value: unknown, fallback = ""): { text: string; style: React.CSSProperties } {
  return {
    text: getTypographyText(value, fallback),
    style: getTypographyStyle(value),
  };
}

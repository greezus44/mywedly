import type { CSSProperties } from "react";

export type TextStyle = {
  family?: "serif" | "sans" | "system";
  size?: number;
  color?: string;
  bold?: boolean;
  align?: "left" | "center" | "right";
};

const FAMILIES: Record<NonNullable<TextStyle["family"]>, string> = {
  serif: "var(--font-serif)",
  sans: "var(--font-sans)",
  system: "ui-sans-serif, system-ui, sans-serif",
};

export function styleFor(s?: TextStyle | null): CSSProperties {
  if (!s) return {};
  return {
    fontFamily: s.family ? FAMILIES[s.family] : undefined,
    fontSize: s.size ? `${s.size}px` : undefined,
    color: s.color || undefined,
    fontWeight: s.bold ? 700 : undefined,
    textAlign: s.align,
  };
}

export function getStyle(
  content: Record<string, any> | null | undefined,
  key: string,
): TextStyle | undefined {
  return (content?.styles ?? {})[key];
}

import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Renders text preserving manual line breaks exactly as entered.
 * Uses `white-space: pre-line` which collapses spaces but preserves newlines.
 * Never auto-inserts line breaks.
 */
export function PreserveText({ children, className, style }: Props) {
  return (
    <span className={className} style={{ whiteSpace: "pre-line", ...style }}>
      {children}
    </span>
  );
}

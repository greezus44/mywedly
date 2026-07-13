import type { CSSProperties, ReactNode } from "react";

export function PreserveText({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <span className={className} style={{ whiteSpace: "pre-line", ...style }}>{children}</span>;
}

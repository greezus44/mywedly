import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function PreserveText({ children, className, style }: Props) {
  return (
    <span className={className} style={{ whiteSpace: "pre-line", ...style }}>
      {children}
    </span>
  );
}

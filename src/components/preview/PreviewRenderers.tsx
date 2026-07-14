import React from "react";
import { type ThemeConfig } from "../../lib/theme";

export function PreviewFrame({ theme, children }: { theme: ThemeConfig; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        fontFamily: theme.bodyFont,
        minHeight: "100%",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export function PreviewButton({ theme, children }: { theme: ThemeConfig; children: React.ReactNode }) {
  return (
    <button
      style={{
        backgroundColor: theme.primary,
        color: "#fff",
        borderRadius: theme.buttonRadius,
        padding: "0.6rem 1.5rem",
        fontFamily: theme.bodyFont,
        border: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function PreviewHeading({ theme, children }: { theme: ThemeConfig; children: React.ReactNode }) {
  return (
    <h1 style={{ fontFamily: theme.headingFont, color: theme.text, fontSize: "2rem", fontWeight: 600 }}>
      {children}
    </h1>
  );
}

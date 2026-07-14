import React from "react";
import type { Json } from "./supabase";
import { jsonToTheme, themeToEventCssVars } from "./theme";

interface EventThemeProviderProps {
  theme: Json | null | undefined;
  children: React.ReactNode;
  className?: string;
}

const EventThemeProvider: React.FC<EventThemeProviderProps> = ({ theme, children, className }) => {
  const fullTheme = jsonToTheme(theme);
  const cssVars = themeToEventCssVars(fullTheme) as React.CSSProperties;
  return (
    <div className={`event-themed ${className ?? ""}`} style={cssVars}>
      {children}
    </div>
  );
};

function useEventTheme(theme: Json | null | undefined) {
  return jsonToTheme(theme);
}

export { EventThemeProvider, useEventTheme };

import React, { createContext, useContext, useMemo } from "react";
import type { Json } from "./supabase";
import { jsonToTheme, themeToEventCssVars, type ThemeConfig } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

interface EventThemeProviderProps {
  theme: Json | null | undefined;
  children: React.ReactNode;
}

export function EventThemeProvider({ theme, children }: EventThemeProviderProps) {
  const resolvedTheme = useMemo(() => jsonToTheme(theme), [theme]);
  const cssVars = useMemo(() => themeToEventCssVars(resolvedTheme), [resolvedTheme]);
  const contextValue = useMemo(() => ({ theme: resolvedTheme }), [resolvedTheme]);

  const style = cssVars as React.CSSProperties;

  return (
    <EventThemeContext.Provider value={contextValue}>
      <div className="event-themed" style={style}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): EventThemeContextValue {
  const ctx = useContext(EventThemeContext);
  if (!ctx) {
    throw new Error("useEventTheme must be used within an EventThemeProvider");
  }
  return ctx;
}

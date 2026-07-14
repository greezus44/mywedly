import React, { createContext, useContext } from "react";
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
  const resolvedTheme = jsonToTheme(theme);
  const cssVars = themeToEventCssVars(resolvedTheme);

  return (
    <EventThemeContext.Provider value={{ theme: resolvedTheme }}>
      <div className="event-themed" style={cssVars}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): ThemeConfig {
  const ctx = useContext(EventThemeContext);
  if (!ctx) {
    throw new Error("useEventTheme must be used within an EventThemeProvider");
  }
  return ctx.theme;
}

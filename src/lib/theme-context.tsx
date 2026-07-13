import React, { createContext, useContext } from "react";
import type { ThemeConfig } from "./supabase";
import { DEFAULT_THEME, themeToEventCssVars } from "./theme";

const EventThemeContext = createContext<{ theme: ThemeConfig }>({ theme: DEFAULT_THEME });

export function EventThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme?: ThemeConfig | null }) {
  const theme = initialTheme || DEFAULT_THEME;
  const cssVars = themeToEventCssVars(theme);
  return (
    <EventThemeContext.Provider value={{ theme }}>
      <div className="event-themed" style={cssVars as React.CSSProperties}>{children}</div>
    </EventThemeContext.Provider>
  );
}
export function useEventTheme() { return useContext(EventThemeContext); }

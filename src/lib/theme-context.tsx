import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ThemeConfig, DEFAULT_THEME, themeToEventCssVars } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

export function EventThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme?: ThemeConfig }) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme || DEFAULT_THEME);
  const cssVars = themeToEventCssVars(theme);
  return (
    <EventThemeContext.Provider value={{ theme, setTheme }}>
      <div className="event-themed" style={cssVars as React.CSSProperties}>{children}</div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme() {
  const ctx = useContext(EventThemeContext);
  if (!ctx) throw new Error("useEventTheme must be used within EventThemeProvider");
  return ctx;
}

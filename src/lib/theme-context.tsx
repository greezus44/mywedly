import React, { createContext, useContext, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  DEFAULT_THEME,
  themeToEventCssVars,
  type ThemeConfig,
} from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
  setTheme: (t: ThemeConfig) => void;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

export function EventThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme?: ThemeConfig;
}) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme ?? DEFAULT_THEME);
  const cssVars = useMemo(() => themeToEventCssVars(theme) as CSSProperties, [theme]);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <EventThemeContext.Provider value={value}>
      <div className="event-themed" style={cssVars}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): EventThemeContextValue {
  const ctx = useContext(EventThemeContext);
  if (!ctx) throw new Error("useEventTheme must be used within EventThemeProvider");
  return ctx;
}

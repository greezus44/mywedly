import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { ThemeConfig, DEFAULT_THEME, themeToEventCssVars } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
  setTheme: (t: ThemeConfig) => void;
}

const EventThemeContext = createContext<EventThemeContextValue | undefined>(undefined);

export function EventThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: ThemeConfig;
}) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme ?? DEFAULT_THEME);

  useEffect(() => {
    if (initialTheme) setTheme(initialTheme);
  }, [initialTheme]);

  const cssVars = useMemo(() => themeToEventCssVars(theme), [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <EventThemeContext.Provider value={value}>
      <div className="event-themed" style={cssVars as React.CSSProperties}>
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

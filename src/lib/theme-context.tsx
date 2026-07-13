import React, { createContext, useContext, useMemo } from "react";
import type { ThemeConfig } from "./supabase";
import { themeToEventCssVars } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig | null;
}

const EventThemeContext = createContext<EventThemeContextValue>({
  theme: null,
});

interface EventThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeConfig | null;
}

export function EventThemeProvider({
  children,
  initialTheme = null,
}: EventThemeProviderProps) {
  const value = useMemo<EventThemeContextValue>(
    () => ({ theme: initialTheme }),
    [initialTheme]
  );

  const cssVars = useMemo(() => themeToEventCssVars(initialTheme), [initialTheme]);

  return (
    <EventThemeContext.Provider value={value}>
      <div className="event-themed" style={cssVars as React.CSSProperties}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): ThemeConfig | null {
  const ctx = useContext(EventThemeContext);
  return ctx.theme;
}

export function useEventCssVars(theme: ThemeConfig | null | undefined): React.CSSProperties {
  return useMemo(() => themeToEventCssVars(theme) as React.CSSProperties, [theme]);
}

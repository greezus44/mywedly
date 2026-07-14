import { createContext, useContext, useMemo, type ReactNode } from "react";
import { jsonToTheme, themeToEventCssVars, type ThemeConfig } from "./theme";
import type { Json } from "./supabase";

interface EventThemeContextValue {
  theme: ThemeConfig;
}

const EventThemeContext = createContext<EventThemeContextValue | undefined>(undefined);

interface EventThemeProviderProps {
  theme: Json | null | undefined;
  children: ReactNode;
}

export function EventThemeProvider({ theme, children }: EventThemeProviderProps) {
  const fullTheme = useMemo(() => jsonToTheme(theme), [theme]);
  const cssVars = useMemo(() => themeToEventCssVars(fullTheme), [fullTheme]);

  return (
    <EventThemeContext.Provider value={{ theme: fullTheme }}>
      <div className="event-themed" style={cssVars as React.CSSProperties}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): ThemeConfig {
  const ctx = useContext(EventThemeContext);
  if (!ctx) {
    return jsonToTheme(null);
  }
  return ctx.theme;
}

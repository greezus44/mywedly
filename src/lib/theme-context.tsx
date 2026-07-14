import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_THEME, jsonToTheme, themeToEventCssVars, type ThemeConfig } from "./theme";
import type { Json } from "./supabase";

interface EventThemeContextValue {
  theme: ThemeConfig;
  cssVars: Record<string, string>;
}

const EventThemeContext = createContext<EventThemeContextValue>({
  theme: DEFAULT_THEME,
  cssVars: themeToEventCssVars(DEFAULT_THEME),
});

interface EventThemeProviderProps {
  theme: Json | null | undefined;
  children: ReactNode;
  className?: string;
}

export function EventThemeProvider({ theme, children, className }: EventThemeProviderProps) {
  const value = useMemo<EventThemeContextValue>(() => {
    const resolved = jsonToTheme(theme);
    return {
      theme: resolved,
      cssVars: themeToEventCssVars(resolved),
    };
  }, [theme]);

  return (
    <EventThemeContext.Provider value={value}>
      <div className={`event-themed ${className ?? ""}`} style={value.cssVars as React.CSSProperties}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): EventThemeContextValue {
  return useContext(EventThemeContext);
}

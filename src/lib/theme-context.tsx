import React, { createContext, useContext, useMemo } from "react";
import { jsonToTheme, themeToEventCssVars, type ThemeConfig } from "./theme";
import type { Json } from "./supabase";

interface EventThemeContextValue {
  theme: ThemeConfig;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

interface EventThemeProviderProps {
  theme: Json | null | undefined;
  children: React.ReactNode;
  className?: string;
}

export function EventThemeProvider({ theme, children, className }: EventThemeProviderProps) {
  const resolvedTheme = useMemo(() => jsonToTheme(theme), [theme]);
  const cssVars = useMemo(() => themeToEventCssVars(resolvedTheme), [resolvedTheme]);

  const style = cssVars as React.CSSProperties;

  return (
    <EventThemeContext.Provider value={{ theme: resolvedTheme }}>
      <div className={cn("event-themed", className)} style={style}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function useEventTheme(): ThemeConfig {
  const ctx = useContext(EventThemeContext);
  if (!ctx) {
    return jsonToTheme(null);
  }
  return ctx.theme;
}

import React, { createContext, useContext, useMemo } from "react";
import type { Json } from "./supabase";
import { jsonToTheme, themeToEventCssVars, type ThemeConfig } from "./theme";
import { cn } from "./utils";

interface EventThemeContextValue {
  theme: ThemeConfig;
}

const EventThemeContext = createContext<EventThemeContextValue>({
  theme: jsonToTheme(null),
});

interface EventThemeProviderProps {
  theme: Json | null | undefined;
  children: React.ReactNode;
  className?: string;
}

export function EventThemeProvider({
  theme,
  children,
  className,
}: EventThemeProviderProps) {
  const resolved = useMemo(() => jsonToTheme(theme), [theme]);
  const cssVars = useMemo(() => themeToEventCssVars(resolved), [resolved]);
  const style = cssVars as React.CSSProperties;

  return (
    <EventThemeContext.Provider value={{ theme: resolved }}>
      <div className={cn("event-themed", className)} style={style}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): ThemeConfig {
  const ctx = useContext(EventThemeContext);
  return ctx.theme;
}

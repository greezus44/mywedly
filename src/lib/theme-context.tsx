import React, { createContext, useContext, useMemo } from "react";
import type { Json } from "./supabase";
import { jsonToTheme, themeToEventCssVars, DEFAULT_THEME } from "./theme";

interface EventThemeContextValue {
  cssVars: Record<string, string>;
}

const EventThemeContext = createContext<EventThemeContextValue>({
  cssVars: themeToEventCssVars(DEFAULT_THEME),
});

interface EventThemeProviderProps {
  theme: Json | null | undefined;
  children: React.ReactNode;
  className?: string;
}

export function EventThemeProvider({ theme, children, className }: EventThemeProviderProps) {
  const resolved = useMemo(() => jsonToTheme(theme), [theme]);
  const cssVars = useMemo(() => themeToEventCssVars(resolved), [resolved]);
  const style = useMemo(() => cssVars as React.CSSProperties, [cssVars]);
  const value = useMemo(() => ({ cssVars }), [cssVars]);
  return (
    <EventThemeContext.Provider value={value}>
      <div className={cn("event-themed", className)} style={style}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): EventThemeContextValue {
  return useContext(EventThemeContext);
}

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

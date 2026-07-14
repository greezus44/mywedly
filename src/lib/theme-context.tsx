import { createContext, useContext, useMemo, type ReactNode } from "react";
import { jsonToTheme, themeToEventCssVars, type ThemeConfig } from "./theme";
import type { Json } from "./supabase";
import { cn } from "./utils";

interface EventThemeContextValue {
  theme: ThemeConfig;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

interface EventThemeProviderProps {
  theme: Json | null | undefined;
  children: ReactNode;
  className?: string;
}

export function EventThemeProvider({ theme, children, className }: EventThemeProviderProps) {
  const resolvedTheme = useMemo(() => jsonToTheme(theme), [theme]);
  const cssVars = useMemo(() => themeToEventCssVars(resolvedTheme), [resolvedTheme]);
  const style = useMemo(() => cssVars as React.CSSProperties, [cssVars]);

  const contextValue = useMemo(() => ({ theme: resolvedTheme }), [resolvedTheme]);

  return (
    <EventThemeContext.Provider value={contextValue}>
      <div className={cn("event-themed", className)} style={style}>
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

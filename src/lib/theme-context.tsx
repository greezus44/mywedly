import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from "react";
import type { Json } from "./supabase";
import { jsonToTheme, themeToEventCssVars, type ThemeConfig } from "./theme";
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
  const resolved = useMemo(() => jsonToTheme(theme), [theme]);
  const style = useMemo(() => themeToEventCssVars(resolved) as CSSProperties, [resolved]);
  const value = useMemo(() => ({ theme: resolved }), [resolved]);
  return (
    <EventThemeContext.Provider value={value}>
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

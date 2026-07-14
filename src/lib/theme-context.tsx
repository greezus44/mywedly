import {
  createContext,
  useContext,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
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

/**
 * Wraps children in a `.event-themed` div and applies all CSS variables
 * derived from the provided theme JSON. Falls back to the default theme
 * when the theme is null/undefined.
 */
export function EventThemeProvider({ theme, children, className }: EventThemeProviderProps) {
  const resolvedTheme = useMemo(() => jsonToTheme(theme), [theme]);
  const cssVars = useMemo(() => themeToEventCssVars(resolvedTheme), [resolvedTheme]);
  const style = cssVars as CSSProperties;

  return (
    <EventThemeContext.Provider value={{ theme: resolvedTheme }}>
      <div className={cn("event-themed", className)} style={style}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

/** Access the resolved event theme within an EventThemeProvider. */
export function useEventTheme(): EventThemeContextValue {
  const ctx = useContext(EventThemeContext);
  if (!ctx) {
    throw new Error("useEventTheme must be used within an EventThemeProvider");
  }
  return ctx;
}

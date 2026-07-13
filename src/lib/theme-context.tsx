import { createContext, useContext, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { ThemeConfig } from "./supabase";
import { themeToEventCssVars } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig | null;
  setTheme: (theme: ThemeConfig | null) => void;
  cssVars: Record<string, string>;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

export function EventThemeProvider({
  children,
  initialTheme = null,
}: {
  children: ReactNode;
  initialTheme?: ThemeConfig | null;
}) {
  const [theme, setTheme] = useState<ThemeConfig | null>(initialTheme);

  const cssVars = useMemo(() => themeToEventCssVars(theme), [theme]);

  const value = useMemo<EventThemeContextValue>(
    () => ({ theme, setTheme, cssVars }),
    [theme, cssVars],
  );

  return (
    <EventThemeContext.Provider value={value}>
      <div className="event-themed" style={cssVars as CSSProperties}>
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

export function useEventCssVars(): Record<string, string> {
  const ctx = useContext(EventThemeContext);
  if (!ctx) {
    throw new Error("useEventCssVars must be used within an EventThemeProvider");
  }
  return ctx.cssVars;
}

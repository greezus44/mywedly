import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_THEME,
  themeToEventCssVars,
  type ThemeConfig,
} from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

interface EventThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeConfig;
}

export function EventThemeProvider({ children, initialTheme }: EventThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme ?? DEFAULT_THEME);

  const cssVars = useMemo(() => themeToEventCssVars(theme), [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <EventThemeContext.Provider value={value}>
      <div className="event-themed" style={cssVars as React.CSSProperties}>
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

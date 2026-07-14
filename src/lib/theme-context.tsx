import React, { createContext, useContext, useMemo } from "react";
import { DEFAULT_THEME, themeToEventCssVars, type ThemeConfig } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
}

const EventThemeContext = createContext<EventThemeContextValue>({
  theme: DEFAULT_THEME,
});

interface EventThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeConfig;
  className?: string;
}

export function EventThemeProvider({
  children,
  initialTheme,
  className,
}: EventThemeProviderProps) {
  const theme = initialTheme ?? DEFAULT_THEME;
  const cssVars = useMemo(() => themeToEventCssVars(theme), [theme]);

  const style = useMemo(() => cssVars as React.CSSProperties, [cssVars]);

  return (
    <EventThemeContext.Provider value={{ theme }}>
      <div className={cn("event-themed", className)} style={style}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): EventThemeContextValue {
  return useContext(EventThemeContext);
}

// Local cn to avoid circular dependency issues; matches utils.cn
function cn(...inputs: (string | undefined | false | null)[]): string {
  return inputs.filter(Boolean).join(" ");
}

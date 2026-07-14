import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { jsonToTheme, themeToEventCssVars, type ThemeConfig } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

interface EventThemeProviderProps {
  theme: unknown;
  children: ReactNode;
}

export function EventThemeProvider({ theme, children }: EventThemeProviderProps) {
  const resolvedTheme = jsonToTheme(theme);
  const cssVars = themeToEventCssVars(resolvedTheme) as CSSProperties;
  return (
    <EventThemeContext.Provider value={{ theme: resolvedTheme }}>
      <div className="event-themed" style={cssVars}>
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

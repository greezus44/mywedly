import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from "react";
import { DEFAULT_THEME, themeToEventCssVars, type ThemeConfig } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
}

const EventThemeContext = createContext<EventThemeContextValue>({
  theme: DEFAULT_THEME,
});

export function useEventTheme(): ThemeConfig {
  const ctx = useContext(EventThemeContext);
  return ctx.theme;
}

interface EventThemeProviderProps {
  theme?: ThemeConfig;
  children: ReactNode;
  className?: string;
}

export function EventThemeProvider({ theme = DEFAULT_THEME, children, className }: EventThemeProviderProps) {
  const cssVars = useMemo(() => themeToEventCssVars(theme) as CSSProperties, [theme]);
  const value = useMemo(() => ({ theme }), [theme]);

  return (
    <EventThemeContext.Provider value={value}>
      <div className={`event-themed ${className ?? ""}`} style={cssVars}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

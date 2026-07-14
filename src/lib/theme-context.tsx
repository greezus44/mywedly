import {
  createContext,
  useContext,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  themeToEventCssVars,
  type ThemeConfig,
} from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
}

const EventThemeContext = createContext<EventThemeContextValue>({
  theme: DEFAULT_THEME,
});

interface EventThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeConfig;
}

export function EventThemeProvider({
  children,
  initialTheme,
}: EventThemeProviderProps) {
  const theme = useMemo(() => initialTheme ?? DEFAULT_THEME, [initialTheme]);

  const cssVars = useMemo(() => {
    const vars = themeToEventCssVars(theme);
    return vars as CSSProperties;
  }, [theme]);

  const value = useMemo(() => ({ theme }), [theme]);

  return (
    <EventThemeContext.Provider value={value}>
      <div className="event-themed" style={cssVars}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): EventThemeContextValue {
  return useContext(EventThemeContext);
}

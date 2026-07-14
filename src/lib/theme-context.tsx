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

export function useEventTheme(): EventThemeContextValue {
  return useContext(EventThemeContext);
}

interface EventThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeConfig;
}

export function EventThemeProvider({
  children,
  initialTheme,
}: EventThemeProviderProps) {
  const theme = useMemo(() => initialTheme ?? DEFAULT_THEME, [initialTheme]);

  const style = useMemo(() => {
    const vars = themeToEventCssVars(theme);
    const cssVars = vars as CSSProperties as Record<string, string>;
    const result: CSSProperties = {};
    for (const [key, value] of Object.entries(cssVars)) {
      (result as Record<string, string>)[key] = value;
    }
    return result;
  }, [theme]);

  return (
    <EventThemeContext.Provider value={{ theme }}>
      <div className="event-themed" style={style}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

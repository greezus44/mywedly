import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { ThemeConfig } from "./supabase";
import {
  DEFAULT_THEME,
  themeToEventCssVars,
} from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
  cssVars: Record<string, string>;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

interface EventThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeConfig | null;
}

/**
 * Wraps children in a `.event-themed` div with CSS variables derived from
 * the provided theme. Provides the theme + computed CSS vars via context.
 */
export function EventThemeProvider({
  children,
  initialTheme,
}: EventThemeProviderProps) {
  const theme = initialTheme ?? DEFAULT_THEME;
  const cssVars = useMemo(() => themeToEventCssVars(theme), [theme]);

  const value = useMemo<EventThemeContextValue>(
    () => ({ theme, cssVars }),
    [theme, cssVars],
  );

  return (
    <EventThemeContext.Provider value={value}>
      <div className="event-themed" style={cssVars}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

/**
 * Access the current event theme and its computed CSS variables.
 */
export function useEventTheme(): EventThemeContextValue {
  const ctx = useContext(EventThemeContext);
  if (!ctx) {
    // Fallback so components used outside a provider still render.
    return {
      theme: DEFAULT_THEME,
      cssVars: themeToEventCssVars(DEFAULT_THEME),
    };
  }
  return ctx;
}

/**
 * Compute the CSS variables for a given theme (handy outside of context).
 */
export function useEventCssVars(theme: ThemeConfig | null | undefined): Record<string, string> {
  return useMemo(() => themeToEventCssVars(theme), [theme]);
}

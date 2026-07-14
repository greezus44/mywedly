import { createContext, useContext, type ReactNode } from "react";
import { jsonToTheme, themeToEventCssVars, type ThemeConfig } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
}

const EventThemeContext = createContext<EventThemeContextValue>({
  theme: jsonToTheme({}),
});

interface EventThemeProviderProps {
  theme: unknown;
  children: ReactNode;
}

export function EventThemeProvider({ theme, children }: EventThemeProviderProps) {
  const resolved = jsonToTheme(theme);
  const cssVars = themeToEventCssVars(resolved);

  return (
    <EventThemeContext.Provider value={{ theme: resolved }}>
      <div
        className="event-themed"
        style={cssVars as React.CSSProperties}
      >
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): EventThemeContextValue {
  return useContext(EventThemeContext);
}

import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from "react";
import { jsonToTheme, themeToEventCssVars } from "./theme";

interface EventThemeContextValue {
  cssVars: Record<string, string>;
}

const EventThemeContext = createContext<EventThemeContextValue>({ cssVars: {} });

interface EventThemeProviderProps {
  theme: unknown;
  children: ReactNode;
}

export function EventThemeProvider({ theme, children }: EventThemeProviderProps) {
  const cssVars = useMemo(() => themeToEventCssVars(jsonToTheme(theme)), [theme]);
  return (
    <EventThemeContext.Provider value={{ cssVars }}>
      <div className="event-themed" style={cssVars as CSSProperties}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): EventThemeContextValue {
  return useContext(EventThemeContext);
}

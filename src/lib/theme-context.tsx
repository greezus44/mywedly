import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from "react";
import { jsonToTheme, themeToEventCssVars } from "./theme";

interface EventThemeContextValue {
  cssVars: Record<string, string>;
}

const EventThemeContext = createContext<EventThemeContextValue>({ cssVars: {} });

interface EventThemeProviderProps {
  theme: unknown;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EventThemeProvider({ theme, children, className, compact }: EventThemeProviderProps) {
  const cssVars = useMemo(() => themeToEventCssVars(jsonToTheme(theme)), [theme]);
  const classes = compact ? `event-themed event-preview${className ? ` ${className}` : ""}` : `event-themed${className ? ` ${className}` : ""}`;
  const style: CSSProperties = { ...cssVars, ...(compact || className ? { minHeight: "auto", height: "100%" } : { minHeight: "100dvh" }) };
  return (
    <EventThemeContext.Provider value={{ cssVars }}>
      <div className={classes} style={style}>
        {children}
      </div>
    </EventThemeContext.Provider>
  );
}

export function useEventTheme(): EventThemeContextValue {
  return useContext(EventThemeContext);
}

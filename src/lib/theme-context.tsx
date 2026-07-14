import React, { createContext, useContext, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { DEFAULT_THEME, themeToEventCssVars, type ThemeConfig } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
}

const EventThemeContext = createContext<EventThemeContextValue | undefined>(undefined);

interface EventThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeConfig;
}

export function EventThemeProvider({ children, initialTheme }: EventThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme ?? DEFAULT_THEME);

  const style = useMemo<CSSProperties>(() => {
    const vars = themeToEventCssVars(theme) as Record<string, string>;
    let background = theme.bg;
    if (theme.bgType === "gradient" && theme.bgGradient) {
      background = theme.bgGradient;
    } else if (theme.bgType === "image" && theme.bgImage) {
      const overlay = theme.bgOverlayOpacity ?? 0;
      const overlayColor = `rgba(0,0,0,${overlay})`;
      background = `linear-gradient(${overlayColor}, ${overlayColor}), url("${theme.bgImage}")`;
      vars["--event-bg-image-position"] = theme.bgImagePosition ?? "center center";
    }
    vars["background"] = background;
    return vars as CSSProperties;
  }, [theme]);

  const value = useMemo<EventThemeContextValue>(() => ({ theme, setTheme }), [theme]);

  return (
    <EventThemeContext.Provider value={value}>
      <div className="event-themed" style={style}>
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

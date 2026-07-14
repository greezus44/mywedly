import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { DEFAULT_THEME, themeToEventCssVars, type ThemeConfig } from "./theme";

interface EventThemeContextValue {
  theme: ThemeConfig;
  setTheme: (t: ThemeConfig) => void;
}

const EventThemeContext = createContext<EventThemeContextValue | undefined>(undefined);

export function EventThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: ThemeConfig;
}) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme ?? DEFAULT_THEME);

  useEffect(() => {
    if (initialTheme) setTheme(initialTheme);
  }, [initialTheme]);

  const cssVars = useMemo(() => themeToEventCssVars(theme), [theme]);

  const style = useMemo(() => {
    const style: Record<string, string> = { ...cssVars };
    if (theme.bgType === "gradient" && theme.bgGradient) {
      style.backgroundImage = theme.bgGradient;
    } else if (theme.bgType === "image" && theme.bgImage) {
      style.backgroundImage = `url(${theme.bgImage})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = theme.bgImagePosition ?? "center";
      if (theme.bgOverlayOpacity !== undefined) {
        style.backgroundImage = `linear-gradient(rgba(0,0,0,${theme.bgOverlayOpacity}), rgba(0,0,0,${theme.bgOverlayOpacity})), url(${theme.bgImage})`;
      }
    }
    return style;
  }, [cssVars, theme]);

  return (
    <EventThemeContext.Provider value={{ theme, setTheme }}>
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

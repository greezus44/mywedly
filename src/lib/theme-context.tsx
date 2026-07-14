import React, { createContext, useContext, useState, useEffect } from "react";
import { type ThemeConfig, jsonToTheme, themeToCssVars } from "./theme";

interface ThemeContextValue {
  theme: ThemeConfig | null;
  setThemeElement: (el: HTMLElement | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function EventThemeProvider({
  themeJson,
  children,
}: {
  themeJson: Record<string, unknown> | null;
  children: React.ReactNode;
}) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const theme = jsonToTheme(themeJson);

  useEffect(() => {
    if (!el) return;
    const vars = themeToCssVars(theme);
    Object.entries(vars).forEach(([k, v]) => {
      el.style.setProperty(k, v);
    });
  }, [el, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setThemeElement: setEl }}>
      <div ref={(node) => { if (node && node !== el) setEl(node); }} style={{ fontFamily: theme.bodyFont }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useEventTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useEventTheme must be used within EventThemeProvider");
  return ctx;
}

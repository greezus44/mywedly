import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ThemeConfig } from "./supabase";
import { DEFAULT_THEME, themeToCssVars } from "./theme";

interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  updateTheme: (partial: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme?: ThemeConfig | null }) {
  const [theme, setThemeState] = useState<ThemeConfig>(initialTheme || DEFAULT_THEME);

  useEffect(() => {
    const vars = themeToCssVars(theme);
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => { root.style.setProperty(key, value); });
  }, [theme]);

  const setTheme = (t: ThemeConfig) => setThemeState(t);
  const updateTheme = (partial: Partial<ThemeConfig>) => setThemeState((prev) => ({ ...prev, ...partial }));
  const resetTheme = () => setThemeState(DEFAULT_THEME);

  return <ThemeContext.Provider value={{ theme, setTheme, updateTheme, resetTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

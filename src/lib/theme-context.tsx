import { createContext, useContext, useState, type ReactNode } from "react";
import type { ThemeConfig } from "./supabase";
import { DEFAULT_THEME, themeToEventCssVars } from "./theme";
interface EventThemeContextValue { theme: ThemeConfig; setTheme: (theme: ThemeConfig) => void; updateTheme: (partial: Partial<ThemeConfig>) => void; cssVars: React.CSSProperties; }
const EventThemeContext = createContext<EventThemeContextValue | null>(null);
export function EventThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme?: ThemeConfig | null }) {
  const [theme, setThemeState] = useState<ThemeConfig>(initialTheme || DEFAULT_THEME);
  const setTheme = (t: ThemeConfig) => setThemeState(t);
  const updateTheme = (partial: Partial<ThemeConfig>) => setThemeState((prev) => ({ ...prev, ...partial }));
  const cssVars = themeToEventCssVars(theme) as React.CSSProperties;
  return <EventThemeContext.Provider value={{ theme, setTheme, updateTheme, cssVars }}><div className="event-themed" style={cssVars}>{children}</div></EventThemeContext.Provider>;
}
export function useEventTheme(): EventThemeContextValue { const ctx = useContext(EventThemeContext); if (!ctx) throw new Error("useEventTheme must be used within EventThemeProvider"); return ctx; }
export function useEventCssVars(theme: ThemeConfig | null): React.CSSProperties { return themeToEventCssVars(theme) as React.CSSProperties; }

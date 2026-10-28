import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dash-theme";
const DARK_CLASS = "dash-dark";

export type DashTheme = "light" | "dark";

export function getStoredDashTheme(): DashTheme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
}

export function applyDashTheme(theme: DashTheme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add(DARK_CLASS);
  else root.classList.remove(DARK_CLASS);
}

export function useDashTheme() {
  const [theme, setTheme] = useState<DashTheme>(() => {
    const stored = getStoredDashTheme();
    if (stored) return stored;
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    applyDashTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle };
}

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setCurrentLanguage } from "./translations";

export type Language = "en" | "bm";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (en: string, bm: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "guest-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "bm") return stored;
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setCurrentLanguage(lang);
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, lang);
  };

  useEffect(() => { setCurrentLanguage(language); }, [language]);

  useEffect(() => {
    const handler = () => {
      if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "en" || stored === "bm") setLanguageState(stored);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const t = (en: string, bm: string) => (language === "bm" ? bm : en);

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { language: "en", setLanguage: () => {}, t: (en: string) => en };
  return ctx;
}

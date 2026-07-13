import { createContext, useContext, useState, useEffect, createElement, type ReactNode } from "react";
import { translations, type Language } from "./i18n";

interface LangContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (typeof translations)["en"];
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Language | null;
    if (stored && (stored === "en" || stored === "ms")) setLangState(stored);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  return createElement(LangContext.Provider, { value: { lang, setLang, t: translations[lang] } }, children);
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

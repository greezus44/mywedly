import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Language } from "./i18n";
import { t as translate, type TranslationKey } from "./i18n";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("wedding-lang");
    return saved === "ms" ? "ms" : "en";
  });

  useEffect(() => {
    localStorage.setItem("wedding-lang", lang);
  }, [lang]);

  const setLang = (l: Language) => setLangState(l);
  const t = (key: TranslationKey) => translate(lang, key);

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

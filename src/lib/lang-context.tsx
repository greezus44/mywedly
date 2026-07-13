import { createContext, useContext, useState, ReactNode } from "react";
import { translations, Language, TranslationKey } from "./i18n";

interface LangContextValue { lang: Language; setLang: (l: Language) => void; t: (key: TranslationKey) => string; }
const LangContext = createContext<LangContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("en");
  const t = (key: TranslationKey) => translations[lang][key] || translations.en[key] || key;
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

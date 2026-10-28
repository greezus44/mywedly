import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type PreviewLanguage = "en" | "bm";

interface PreviewLanguageContextValue {
  language: PreviewLanguage;
  isBm: boolean;
  toggle: () => void;
}

const PreviewLanguageContext = createContext<PreviewLanguageContextValue | null>(null);

export function PreviewLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<PreviewLanguage>("en");
  const toggle = useCallback(() => setLanguage((p) => (p === "en" ? "bm" : "en")), []);
  return (
    <PreviewLanguageContext.Provider value={{ language, isBm: language === "bm", toggle }}>
      {children}
    </PreviewLanguageContext.Provider>
  );
}

export function usePreviewLanguage(): PreviewLanguageContextValue {
  const ctx = useContext(PreviewLanguageContext);
  if (!ctx) return { language: "en", isBm: false, toggle: () => {} };
  return ctx;
}

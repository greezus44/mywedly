import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type PreviewLanguage = "en" | "bm";
export type PreviewDevice = "phone" | "tablet" | "laptop";

interface PreviewLanguageContextValue {
  language: PreviewLanguage;
  isBm: boolean;
  toggle: () => void;
  device: PreviewDevice;
  setDevice: (d: PreviewDevice) => void;
}

const PreviewLanguageContext = createContext<PreviewLanguageContextValue | null>(null);

export function PreviewLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<PreviewLanguage>("en");
  const [device, setDevice] = useState<PreviewDevice>("phone");
  const toggle = useCallback(() => setLanguage((p) => (p === "en" ? "bm" : "en")), []);
  return (
    <PreviewLanguageContext.Provider value={{ language, isBm: language === "bm", toggle, device, setDevice }}>
      {children}
    </PreviewLanguageContext.Provider>
  );
}

export function usePreviewLanguage(): PreviewLanguageContextValue {
  const ctx = useContext(PreviewLanguageContext);
  if (!ctx) return { language: "en", isBm: false, toggle: () => {}, device: "phone", setDevice: () => {} };
  return ctx;
}

import { useLanguage, type Language } from "../../lib/language";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const opt = (lang: Language, label: string) => (
    <button
      onClick={() => setLanguage(lang)}
      className="px-3 py-1.5 text-xs font-medium transition-all"
      style={{
        backgroundColor: language === lang ? "var(--event-primary)" : "transparent",
        color: language === lang ? "#fff" : "var(--event-text)",
        opacity: language === lang ? 1 : 0.7,
      }}
      aria-pressed={language === lang}
    >
      {label}
    </button>
  );
  return (
    <div
      className="fixed right-4 top-4 z-40 flex items-stretch rounded-lg overflow-hidden"
      style={{
        border: "1px solid var(--event-border)",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {opt("en", "English")}
      <div style={{ width: "1px", backgroundColor: "var(--event-border)" }} />
      {opt("bm", "Bahasa Melayu")}
    </div>
  );
}

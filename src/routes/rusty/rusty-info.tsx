import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { RUSTY_THEME } from "../../lib/theme";
import type { UserEvent, ContentSection } from "../../lib/supabase";
import type { Lang } from "./rusty-layout";

const LANG_STORAGE_KEY = "guest-lang";

interface OutletContext {
  event: UserEvent;
  lang: Lang;
}

export default function RustyInfo() {
  const { event } = useOutletContext<OutletContext>();
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "bm") setLang(saved);
  }, []);

  const theme = event.theme || RUSTY_THEME;
  const headingFont = theme.headingFont || "Cormorant Garamond";
  const scriptFont = theme.scriptFont || "Cormorant Garamond";

  const content = event.content;
  const sections: ContentSection[] = (content?.sections || [])
    .filter((s) => s.visible)
    .sort((a, b) => a.order_index - b.order_index);

  const t = {
    en: { title: "Information", empty: "No information available at this time." },
    bm: { title: "Maklumat", empty: "Tiada maklumat tersedia buat masa ini." },
  }[lang];

  return (
    <div className="animate-fade-in py-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="h-px w-10 bg-rusty-gold-dark/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-rusty-gold-dark" />
          <span className="h-px w-10 bg-rusty-gold-dark/40" />
        </div>
        <h1 className="font-serif text-3xl text-rusty-text" style={{ fontFamily: `"${headingFont}", serif` }}>
          {t.title}
        </h1>
      </div>

      {sections.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-rusty-text-light italic" style={{ fontFamily: `"${scriptFont}", serif` }}>
            {t.empty}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-lg border border-rusty-border bg-rusty-cream/50 overflow-hidden animate-fade-in-up"
            >
              {section.image && (
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full h-44 object-cover"
                />
              )}
              <div className="p-5">
                <h2 className="font-serif text-xl text-rusty-text mb-2" style={{ fontFamily: `"${headingFont}", serif` }}>
                  {section.title}
                </h2>
                <p className="text-sm leading-relaxed text-rusty-text-light whitespace-pre-line">
                  {section.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

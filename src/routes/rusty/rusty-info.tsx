import { useOutletContext } from "react-router-dom";
import { EmptyState } from "../../components/ui/index";
import type { Lang } from "./rusty-layout";
import type { RustyOutletContext } from "./rusty-layout";
import type { ContentSection } from "../../lib/supabase";
import type { CSSProperties } from "react";

const translations = {
  en: {
    title: "Information",
    subtitle: "Everything you need to know",
    empty: "No information available yet",
    emptyDesc: "Details about the event will appear here soon.",
  },
  bm: {
    title: "Maklumat",
    subtitle: "Semua yang anda perlu tahu",
    empty: "Maklumat belum tersedia",
    emptyDesc: "Butiran acara akan dipaparkan di sini tidak lama lagi.",
  },
};

export default function RustyInfo() {
  const { event, lang } = useOutletContext<RustyOutletContext>();
  const t = translations[lang];

  if (!event) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-serif text-lg text-[#8B7355]">{t.empty}</p>
      </div>
    );
  }

  const content = event.content || event.draft_content || {};
  const allSections: ContentSection[] = content.sections || [];
  const sections = allSections
    .filter((s) => s.visible)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const cssVars = {} as CSSProperties;

  return (
    <div style={cssVars} className="animate-fade-in px-6 py-10 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-12" style={{ backgroundColor: "#B8962E" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "#B8962E" }} />
          <div className="h-px w-12" style={{ backgroundColor: "#B8962E" }} />
        </div>
        <h1
          className="font-serif text-4xl font-light mb-2"
          style={{ color: "#3D3528", fontFamily: '"Cormorant Garamond", serif' }}
        >
          {t.title}
        </h1>
        <p className="text-sm" style={{ color: "#8B7355" }}>
          {t.subtitle}
        </p>
      </div>

      {sections.length === 0 ? (
        <EmptyState title={t.empty} description={t.emptyDesc} />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-lg p-8 border"
              style={{
                backgroundColor: "#FAF3E0",
                borderColor: "#D4C695",
              }}
            >
              <div className="flex items-center justify-center gap-4 mb-5">
                <div className="h-px w-8" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
                <h2
                  className="font-serif text-2xl font-light text-center tracking-wide"
                  style={{ color: "#3D3528", fontFamily: '"Cormorant Garamond", serif' }}
                >
                  {section.title}
                </h2>
                <div className="h-px w-8" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
              </div>

              {section.image && (
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full max-w-md mx-auto rounded-lg mb-6 object-cover"
                  style={{ maxHeight: 280 }}
                />
              )}

              {section.body && (
                <p
                  className="text-base leading-relaxed text-center whitespace-pre-line"
                  style={{ color: "#3D3528" }}
                >
                  {section.body}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { CSSProperties } from "react";
import type { UserEvent, ContentSection } from "../../lib/supabase";
import type { Lang } from "./rusty-layout";

const CREAM = "#F5ECD7";
const CREAM_LIGHT = "#FAF3E0";
const GOLD = "#B8962E";
const TEXT = "#3D3528";
const TEXT_MUTED = "#8B7355";
const BORDER = "#D4C695";

interface OutletContext {
  event: UserEvent;
  eventId: string;
}

export function RustyInfo() {
  const { event } = useOutletContext<OutletContext>();
  const [lang, setLang] = useState<Lang>("en");

  const content = event.content || {};
  const sections: ContentSection[] = (content.sections || [])
    .filter((s) => s.visible)
    .sort((a, b) => a.order_index - b.order_index);

  const t = {
    en: { title: "Information" },
    bm: { title: "Maklumat" },
  }[lang];

  const dividerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
  };

  return (
    <div className="max-w-2xl mx-auto py-6" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
      <div className="flex justify-end mb-4">
        <div className="flex gap-2">
          {(["en", "bm"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-1 text-xs tracking-wider uppercase transition-all"
              style={{
                fontFamily: '"Inter", sans-serif',
                color: lang === l ? CREAM : GOLD,
                backgroundColor: lang === l ? GOLD : "transparent",
                border: `1px solid ${GOLD}`,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <section className="text-center mb-10">
        <div style={dividerStyle} className="mb-4">
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
            {t.title}
          </span>
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
        </div>
      </section>

      {sections.length === 0 ? (
        <div className="text-center py-16">
          <span className="block h-px w-16 mx-auto mb-4" style={{ backgroundColor: GOLD, opacity: 0.4 }} />
          <p className="text-lg" style={{ color: TEXT_MUTED, fontFamily: '"Cormorant Garamond", serif' }}>
            No information available
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.id}
              className="overflow-hidden rounded-sm"
              style={{ backgroundColor: CREAM_LIGHT, border: `1px solid ${BORDER}` }}
            >
              {section.image && (
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full max-h-72 object-cover"
                />
              )}
              <div className="p-6">
                <div style={dividerStyle} className="mb-4">
                  <span className="block h-px w-6" style={{ backgroundColor: GOLD, opacity: 0.5 }} />
                  <span className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
                    {section.title}
                  </span>
                  <span className="block h-px w-6" style={{ backgroundColor: GOLD, opacity: 0.5 }} />
                </div>
                <p className="text-base leading-relaxed text-center" style={{ color: TEXT, fontFamily: '"Cormorant Garamond", serif' }}>
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

export default RustyInfo;

import { useOutletContext } from "react-router-dom";
import { UserEvent, InfoSection } from "../../lib/supabase";
import { EmptyState } from "../../components/ui/index";
import type { Lang } from "./rusty-layout";
import type { CSSProperties } from "react";

interface OutletContext {
  event: UserEvent;
  lang: Lang;
}

const content = {
  en: {
    title: "Information",
    subtitle: "Everything you need to know",
    noSections: "No information available yet",
  },
  bm: {
    title: "Maklumat",
    subtitle: "Semua yang anda perlu tahu",
    noSections: "Tiada maklumat tersedia buat masa ini",
  },
};

export default function RustyInfo() {
  const { event, lang } = useOutletContext<OutletContext>();
  const t = content[lang];

  const sections: InfoSection[] = (event.content?.sections || [])
    .filter((s) => s.visible)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const sectionStyle: CSSProperties = {
    maxWidth: "var(--max-width)",
    margin: "0 auto",
    paddingTop: "var(--section-padding)",
    paddingBottom: "var(--section-padding)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "24px",
    paddingRight: "24px",
    width: "100%",
  };

  const headingStyle: CSSProperties = {
    color: "var(--heading-color)",
    fontFamily: "var(--heading-font)",
  };

  const cardStyle: CSSProperties = {
    borderColor: "#C4A44A",
    borderWidth: "1px",
    borderStyle: "solid",
    backgroundColor: "rgba(250, 243, 224, 0.6)",
  };

  return (
    <div>
      <section style={sectionStyle} className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="h-px w-10 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
          <span className="h-px w-10 bg-[#C4A44A]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-medium mb-3" style={headingStyle}>
          {t.title}
        </h1>
        <p className="text-sm text-[#A07820] italic" style={{ fontFamily: "var(--script-font)" }}>
          {t.subtitle}
        </p>

        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="h-px w-10 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
          <span className="h-px w-10 bg-[#C4A44A]" />
        </div>
      </section>

      {sections.length === 0 ? (
        <section style={{ ...sectionStyle, paddingTop: 0 }}>
          <EmptyState title={t.noSections} />
        </section>
      ) : (
        <section style={{ ...sectionStyle, paddingTop: 0 }}>
          <div className="space-y-6">
            {sections.map((section) => (
              <div
                key={section.id}
                className="rounded-lg p-6"
                style={cardStyle}
              >
                {section.image && (
                  <img
                    src={section.image}
                    alt={section.title}
                    className="w-full h-48 object-cover rounded-md mb-5"
                    style={{ border: "1px solid #C4A44A" }}
                  />
                )}

                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="h-px w-6 bg-[#C4A44A]/50" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
                  <span className="h-px w-6 bg-[#C4A44A]/50" />
                </div>

                <h2 className="text-2xl font-medium text-center mb-4" style={headingStyle}>
                  {section.title}
                </h2>

                {section.body && (
                  <p className="text-sm leading-relaxed text-[#8B7355] whitespace-pre-line text-center">
                    {section.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

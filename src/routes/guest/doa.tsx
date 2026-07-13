import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import {
  themeToCssVars,
  getTheme,
  getLogoConfig,
  getLogoStyle,
  shouldShowLogo,
} from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";
import { Heart } from "lucide-react";

export function Doa() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) setWedding(data as Wedding);
    });
  }, [slug]);

  const theme = getTheme(wedding);
  const content = (wedding?.draft_content || wedding?.content || {}) as WeddingContent;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "doa");

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme), background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" } as React.CSSProperties}
    >
      {/* Logo */}
      {showLogo && logo.url && (
        <div className="flex justify-center pt-12">
          <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-16 text-center md:py-24">
        <p className="animate-fade-in-up font-script text-2xl md:text-3xl" style={{ color: "var(--color-accent)" }}>
          Bismillah
        </p>

        {/* Divider */}
        <div className="my-6 flex items-center justify-center gap-3">
          <div className="h-px w-8 animate-fade-in bg-current opacity-20" style={{ animationDelay: "0.1s" }} />
          <Heart className="h-3 w-3 animate-fade-in opacity-30" style={{ color: "var(--color-accent)", animationDelay: "0.15s" }} />
          <div className="h-px w-8 animate-fade-in bg-current opacity-20" style={{ animationDelay: "0.1s" }} />
        </div>

        <h1 className="animate-fade-in-up font-heading text-3xl md:text-5xl" style={{ color: "var(--color-primary)", animationDelay: "0.2s" }}>
          {content.doa_title || (lang === "ms" ? "Doa" : "Prayer")}
        </h1>
      </div>

      {/* Doa body */}
      {content.doa_body && (
        <section className="flex justify-center px-6 pb-12">
          <div className="max-w-lg animate-fade-in-up text-center" style={{ animationDelay: "0.1s" }}>
            <p className="font-body text-base font-light leading-loose md:text-lg" style={{ color: "var(--color-text)" }}>
              {content.doa_body}
            </p>
          </div>
        </section>
      )}

      {/* Doa image */}
      {content.doa_image_url && (
        <section className="flex justify-center px-6 py-8">
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <img
              src={content.doa_image_url}
              alt="doa"
              className="rounded-lg shadow-md"
              style={{ maxHeight: "300px", objectFit: "contain" }}
            />
          </div>
        </section>
      )}

      {/* Closing */}
      <section className="flex justify-center px-6 pb-20 pt-8">
        <div className="max-w-lg animate-fade-in-up text-center" style={{ animationDelay: "0.1s" }}>
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-px w-6" style={{ background: "var(--color-border)" }} />
            <Heart className="h-3 w-3" style={{ color: "var(--color-accent)", opacity: 0.5 }} />
            <div className="h-px w-6" style={{ background: "var(--color-border)" }} />
          </div>
          <p className="font-body text-sm font-light italic" style={{ color: "var(--color-text-muted)" }}>
            {lang === "ms"
              ? "Semoga Allah memberkati majlis ini dan meredai doa kami."
              : "May Allah bless this gathering and accept our prayers."}
          </p>
        </div>
      </section>
    </div>
  );
}

export default Doa;

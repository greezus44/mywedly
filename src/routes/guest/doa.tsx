import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
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
  useGuestAuth(); // ensure auth context
  const { lang } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setWedding(data as Wedding);
      });
  }, [slug]);

  const theme = getTheme(wedding);
  const content = (wedding?.content || {}) as WeddingContent;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "doa") && logo.url;

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeToCssVars(theme),
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      } as React.CSSProperties}
    >
      {/* Header */}
      <section className="px-6 py-16 md:py-24">
        {/* Logo */}
        {showLogo && (
          <div className="mb-10 flex justify-center animate-fade-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <img src={logo.url!} alt="logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Bismillah */}
        <p
          className="text-center font-script text-2xl text-gray-400 animate-fade-in-up md:text-3xl"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          Bismillah
        </p>

        {/* Title */}
        <h1
          className="mt-6 text-center font-heading text-3xl font-light md:text-5xl animate-fade-in-up"
          style={{
            animationDelay: "0.3s",
            opacity: 0,
            color: "var(--color-text)",
            fontFamily: "var(--font-heading)",
          }}
        >
          {content.doa_title || (lang === "ms" ? "Doa" : "Prayer")}
        </h1>

        {/* Divider */}
        <div className="mx-auto mt-8 flex items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <div className="h-px w-10 bg-gray-200" />
          <Heart className="h-3 w-3 text-gray-300" />
          <div className="h-px w-10 bg-gray-200" />
        </div>
      </section>

      {/* Doa body */}
      {content.doa_body && (
        <section className="px-6 pb-16 md:pb-24">
          <div className="mx-auto max-w-2xl">
            <p
              className="animate-fade-in-up text-center font-body text-base leading-loose text-gray-600 md:text-lg"
              style={{ animationDelay: "0.2s", opacity: 0, lineHeight: "2" }}
            >
              {content.doa_body}
            </p>
          </div>
        </section>
      )}

      {/* Doa image */}
      {content.doa_image_url && (
        <section className="px-6 pb-16 md:pb-24">
          <div className="mx-auto max-w-2xl animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
            <img
              src={content.doa_image_url}
              alt="doa"
              className="mx-auto rounded-sm shadow-sm"
              style={{ maxHeight: "300px" }}
            />
          </div>
        </section>
      )}

      {/* Closing */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-xl text-center">
          <p
            className="animate-fade-in-up font-body text-xs uppercase tracking-[0.2em] text-gray-400"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            {lang === "ms"
              ? "Semoga Allah memberkati majlis ini"
              : "May Allah bless this occasion"}
          </p>
        </div>
      </section>
    </div>
  );
}

export default Doa;

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getLogoConfig, getLogoStyle, shouldShowLogo } from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";

export function Doa() {
  const { slug } = useParams<{ slug: string }>();
  const { session } = useGuestAuth();
  const { lang } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) setWedding(data as Wedding);
    });
  }, [slug]);

  const theme = getTheme(wedding);
  const content = (wedding?.draft_content || wedding?.content || {}) as Record<string, unknown>;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "doa");

  const doaTitle = content.doa_title ? String(content.doa_title) : (lang === "en" ? "Prayer" : "Doa");
  const doaBody = content.doa_body ? String(content.doa_body) : "";
  const doaImage = content.doa_image_url ? String(content.doa_image_url) : "";

  return (
    <div
      className="min-h-screen px-6 py-12 md:py-20"
      style={{
        ...themeToCssVars(theme),
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      } as React.CSSProperties}
    >
      <div className="max-w-xl mx-auto">
        {/* Logo */}
        {showLogo && logo.url && (
          <div className="flex justify-center mb-8 animate-fade-in">
            <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Bismillah */}
        <div className="text-center mb-8 animate-fade-in-up">
          <p
            className="font-script text-3xl md:text-4xl"
            style={{ color: "var(--color-accent)" }}
          >
            Bismillah
          </p>
        </div>

        {/* Title */}
        <h1
          className="text-center font-heading mb-8 animate-fade-in-up"
          style={{
            color: "var(--color-primary)",
            fontSize: "2.5rem",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            animationDelay: "0.1s",
          }}
        >
          {doaTitle}
        </h1>

        {/* Body */}
        {doaBody && (
          <div
            className="text-center leading-relaxed animate-fade-in-up"
            style={{ color: "var(--color-text)", animationDelay: "0.2s" }}
          >
            <p className="whitespace-pre-line text-base md:text-lg">{doaBody}</p>
          </div>
        )}

        {/* Image */}
        {doaImage && (
          <div className="mt-10 flex justify-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <img
              src={doaImage}
              alt="Doa"
              className="rounded-2xl shadow-sm max-w-full"
              style={{ maxHeight: "300px" }}
            />
          </div>
        )}

        {/* Closing */}
        <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <p
            className="font-script text-2xl"
            style={{ color: "var(--color-accent)" }}
          >
            Ameen
          </p>
        </div>
      </div>
    </div>
  );
}

export default Doa;

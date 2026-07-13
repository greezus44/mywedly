import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, coverToCssVars, getCoverConfig, getCoverContent } from "../../lib/theme";

function DoaInner() {
  const navigate = useNavigate();
  const params = useParams();
  const slug = params.slug || "";
  const { session, loading } = useGuestAuth();
  const { t } = useLang();

  const wedding = session?.wedding ?? null;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [session, loading, slug, navigate]);

  if (loading || !session) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)" } as CSSProperties}
      >
        <Heart size={24} className="animate-pulse" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const content = getCoverContent(wedding);

  return (
    <div
      className="min-h-screen pb-16"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as CSSProperties}
    >
      {/* Header */}
      <section className="px-6 md:px-12 pt-12 md:pt-16 text-center animate-fade-in opacity-0-init">
        <p
          className="font-ui text-xs uppercase tracking-luxe mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          {t("doa")}
        </p>
        <h1
          className="font-script text-3xl md:text-5xl mb-4"
          style={{ color: "var(--color-text)" }}
        >
          {content.doa_title || t("doa")}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
          <Sparkles size={14} style={{ color: "var(--color-primary)" }} />
          <div className="h-px w-12" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
        </div>
      </section>

      {/* Doa Image */}
      {content.doa_image_url && (
        <div className="px-6 md:px-12 mb-10 max-w-2xl mx-auto animate-fade-in-up opacity-0-init delay-200">
          <img
            src={content.doa_image_url}
            alt="Doa"
            className="w-full rounded-lg object-cover"
            style={{
              borderRadius: "var(--radius, 8px)",
              maxHeight: "400px",
              border: "1px solid var(--color-border)",
              borderColor: "color-mix(in srgb, var(--color-border) 20%, transparent)",
            }}
          />
        </div>
      )}

      {/* Doa Body */}
      {content.doa_body && (
        <section className="px-6 md:px-12 max-w-2xl mx-auto animate-fade-in-up opacity-0-init delay-300">
          <div
            className="p-8 md:p-10"
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius, 8px)",
              border: "1px solid var(--color-border)",
              borderColor: "color-mix(in srgb, var(--color-border) 20%, transparent)",
              boxShadow: "0 2px 12px rgba(184, 151, 58, 0.06)",
            }}
          >
            <p
              className="font-body text-lg md:text-xl leading-relaxed text-center"
              style={{ color: "var(--color-text)" }}
            >
              {content.doa_body}
            </p>
          </div>
        </section>
      )}

      {/* Decorative footer */}
      <div className="text-center mt-12 animate-fade-in opacity-0-init delay-500">
        <Heart
          size={16}
          style={{ color: "var(--color-primary)", opacity: 0.4 }}
        />
      </div>
    </div>
  );
}

export function Doa() {
  return (
    <GuestAuthProvider>
      <DoaInner />
    </GuestAuthProvider>
  );
}

export default Doa;

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import {
  themeToCssVars,
  getTheme,
  getLogoConfig,
  getLogoStyle,
  shouldShowLogo,
} from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";
import { Heart } from "lucide-react";

function DoaInner() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading } = useGuestAuth();
  const { lang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session || (slug && session.wedding_slug !== slug)) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [session, loading, slug, navigate]);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("weddings")
      .select("*")
      .eq("id", session.wedding_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setWedding(data as Wedding);
      });
  }, [session]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <Heart className="h-8 w-8 animate-pulse" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!session) return null;

  const theme = getTheme(wedding);
  const content = (wedding?.content || wedding?.draft_content || {}) as Record<string, unknown>;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme) } as React.CSSProperties}
    >
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Logo */}
        {shouldShowLogo(logo, "doa") && logo.url && (
          <div className="mb-8 flex justify-center animate-fade-in">
            <img src={logo.url} alt="Logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <h1
            className="mb-2"
            style={{
              color: "var(--color-text)",
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
            }}
          >
            {t.doa}
          </h1>
          <div className="mx-auto flex w-16 items-center justify-center gap-2">
            <span className="h-px flex-1" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
            <Heart className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <span className="h-px flex-1" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
          </div>
        </div>

        {/* Doa image */}
        {typeof content.doa_image_url === "string" && content.doa_image_url && (
          <div className="mb-8 flex justify-center animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <img
              src={content.doa_image_url}
              alt="Doa"
              className="rounded-2xl"
              style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "cover" }}
            />
          </div>
        )}

        {/* Doa title */}
        {typeof content.doa_title === "string" && content.doa_title && (
          <h2
            className="mb-4 text-center animate-fade-in-up"
            style={{
              color: "var(--color-text)",
              fontFamily: "var(--font-heading)",
              fontSize: "1.5rem",
              animationDelay: "0.15s",
            }}
          >
            {content.doa_title}
          </h2>
        )}

        {/* Doa body */}
        {typeof content.doa_body === "string" && content.doa_body && (
          <div
            className="rounded-2xl p-6 animate-fade-in-up"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              animationDelay: "0.2s",
            }}
          >
            <p
              className="leading-loose"
              style={{
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--font-body-size)",
                direction: "rtl",
                textAlign: "center",
              }}
            >
              {content.doa_body}
            </p>
          </div>
        )}

        {/* Fallback if no doa content */}
        {!content.doa_body && !content.doa_title && (
          <div
            className="rounded-2xl p-8 text-center animate-fade-in-up"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <Heart className="mx-auto mb-4 h-8 w-8" style={{ color: "var(--color-primary)" }} />
            <p
              className="leading-relaxed"
              style={{
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              {lang === "ms"
                ? "Semoga Allah memberkati pasangan ini dengan kebahagiaan dan kasih sayang yang berpanjangan."
                : "May Allah bless this couple with everlasting happiness and love."}
            </p>
          </div>
        )}
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

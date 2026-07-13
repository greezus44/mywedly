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
import { Heart, Phone, Mail, MapPin } from "lucide-react";

function ContactInner() {
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

  const phone = typeof content.contact_phone === "string" ? content.contact_phone : null;
  const email = typeof content.contact_email === "string" ? content.contact_email : null;
  const address = typeof content.contact_address === "string" ? content.contact_address : null;

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme) } as React.CSSProperties}
    >
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Logo */}
        {shouldShowLogo(logo, "contact") && logo.url && (
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
            {t.contact}
          </h1>
          <div className="mx-auto flex w-16 items-center justify-center gap-2">
            <span className="h-px flex-1" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
            <Heart className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <span className="h-px flex-1" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
          </div>
        </div>

        {/* Contact cards */}
        <div className="space-y-4">
          {/* Phone */}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-4 rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] animate-fade-in-up"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                animationDelay: "0.1s",
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
              >
                <Phone className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <p
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
                >
                  {lang === "ms" ? "Telefon" : "Phone"}
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text)", fontFamily: "var(--font-body)" }}
                >
                  {phone}
                </p>
              </div>
            </a>
          )}

          {/* Email */}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-4 rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] animate-fade-in-up"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                animationDelay: "0.2s",
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
              >
                <Mail className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
              </div>
              <div className="min-w-0">
                <p
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
                >
                  {lang === "ms" ? "E-mel" : "Email"}
                </p>
                <p
                  className="truncate text-sm font-medium"
                  style={{ color: "var(--color-text)", fontFamily: "var(--font-body)" }}
                >
                  {email}
                </p>
              </div>
            </a>
          )}

          {/* Address */}
          {address && (
            <div
              className="flex items-start gap-4 rounded-2xl p-5 animate-fade-in-up"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                animationDelay: "0.3s",
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
              >
                <MapPin className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <p
                  className="mb-1 text-xs uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
                >
                  {lang === "ms" ? "Alamat" : "Address"}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text)", fontFamily: "var(--font-body)" }}
                >
                  {address}
                </p>
              </div>
            </div>
          )}

          {/* Fallback if no contact info */}
          {!phone && !email && !address && (
            <div
              className="rounded-2xl p-8 text-center animate-fade-in-up"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Heart className="mx-auto mb-4 h-8 w-8" style={{ color: "var(--color-primary)" }} />
              <p
                style={{
                  color: "var(--color-text-muted)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {lang === "ms"
                  ? "Maklumat hubungan akan dikemaskini tidak lama lagi."
                  : "Contact information will be updated soon."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Contact() {
  return (
    <GuestAuthProvider>
      <ContactInner />
    </GuestAuthProvider>
  );
}

export default Contact;

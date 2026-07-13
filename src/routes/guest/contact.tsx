import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Phone, Mail, MapPin, Heart } from "lucide-react";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, coverToCssVars, getCoverConfig, getCoverContent } from "../../lib/theme";

function ContactInner() {
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

  const phone = content.contact_phone || wedding?.contact_phone || null;
  const email = content.contact_email || null;
  const address = content.contact_address || wedding?.location || null;

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
          {t("contact")}
        </p>
        <h1
          className="font-script text-3xl md:text-5xl mb-4"
          style={{ color: "var(--color-text)" }}
        >
          {t("contact")}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
          <Heart size={14} style={{ color: "var(--color-primary)" }} />
          <div className="h-px w-12" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
        </div>
      </section>

      {/* Contact cards */}
      <section className="px-6 md:px-12 max-w-2xl mx-auto space-y-4">
        {/* Phone */}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-4 p-6 animate-fade-in-up opacity-0-init delay-200 transition-all hover:scale-[1.02]"
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius, 8px)",
              border: "1px solid var(--color-border)",
              borderColor: "color-mix(in srgb, var(--color-border) 20%, transparent)",
              boxShadow: "0 2px 12px rgba(184, 151, 58, 0.06)",
            }}
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}
            >
              <Phone size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p
                className="font-ui text-[10px] uppercase tracking-luxe mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t("contact")} • Phone
              </p>
              <p
                className="font-body text-lg"
                style={{ color: "var(--color-text)" }}
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
            className="flex items-center gap-4 p-6 animate-fade-in-up opacity-0-init delay-300 transition-all hover:scale-[1.02]"
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius, 8px)",
              border: "1px solid var(--color-border)",
              borderColor: "color-mix(in srgb, var(--color-border) 20%, transparent)",
              boxShadow: "0 2px 12px rgba(184, 151, 58, 0.06)",
            }}
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}
            >
              <Mail size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p
                className="font-ui text-[10px] uppercase tracking-luxe mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t("contact")} • Email
              </p>
              <p
                className="font-body text-lg break-all"
                style={{ color: "var(--color-text)" }}
              >
                {email}
              </p>
            </div>
          </a>
        )}

        {/* Address */}
        {address && (
          <div
            className="flex items-start gap-4 p-6 animate-fade-in-up opacity-0-init delay-400"
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius, 8px)",
              border: "1px solid var(--color-border)",
              borderColor: "color-mix(in srgb, var(--color-border) 20%, transparent)",
              boxShadow: "0 2px 12px rgba(184, 151, 58, 0.06)",
            }}
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}
            >
              <MapPin size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p
                className="font-ui text-[10px] uppercase tracking-luxe mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t("address")}
              </p>
              <p
                className="font-body text-lg leading-relaxed"
                style={{ color: "var(--color-text)" }}
              >
                {address}
              </p>
            </div>
          </div>
        )}

        {/* Fallback if no contact info */}
        {!phone && !email && !address && (
          <div className="text-center py-12 animate-fade-in opacity-0-init">
            <p
              className="font-ui text-sm uppercase tracking-wider-luxe"
              style={{ color: "var(--color-text-muted)" }}
            >
              {t("loading")}
            </p>
          </div>
        )}
      </section>
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

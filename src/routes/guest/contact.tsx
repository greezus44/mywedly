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
import { Heart, MapPin, Mail, Phone } from "lucide-react";

export function Contact() {
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
  const showLogo = shouldShowLogo(logo, "contact");

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
        <p className="animate-fade-in-up text-[0.625rem] uppercase tracking-[0.4em]" style={{ color: "var(--color-text-muted)" }}>
          {lang === "ms" ? "Hubungi Kami" : "Get In Touch"}
        </p>

        {/* Divider */}
        <div className="my-6 flex items-center justify-center gap-3">
          <div className="h-px w-8 animate-fade-in bg-current opacity-20" style={{ animationDelay: "0.1s" }} />
          <Heart className="h-3 w-3 animate-fade-in opacity-30" style={{ color: "var(--color-accent)", animationDelay: "0.15s" }} />
          <div className="h-px w-8 animate-fade-in bg-current opacity-20" style={{ animationDelay: "0.1s" }} />
        </div>

        <h1 className="animate-fade-in-up font-heading text-3xl md:text-5xl" style={{ color: "var(--color-primary)", animationDelay: "0.2s" }}>
          {lang === "ms" ? "Hubungi" : "Contact"}
        </h1>
      </div>

      {/* Contact info */}
      <div className="mx-auto max-w-xl px-6 pb-16">
        <div className="space-y-6">
          {/* Phone */}
          {content.contact_phone && (
            <a
              href={`tel:${content.contact_phone}`}
              className="flex animate-fade-in-up items-center gap-4 rounded-2xl border p-5 transition hover:opacity-80"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                animationDelay: "0.1s",
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--color-primary)" }}>
                <Phone className="h-4 w-4" style={{ color: "var(--color-button-text)" }} />
              </div>
              <div>
                <p className="text-[0.625rem] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                  {lang === "ms" ? "Telefon" : "Phone"}
                </p>
                <p className="font-body text-sm md:text-base" style={{ color: "var(--color-text)" }}>
                  {content.contact_phone}
                </p>
              </div>
            </a>
          )}

          {/* Email */}
          {content.contact_email && (
            <a
              href={`mailto:${content.contact_email}`}
              className="flex animate-fade-in-up items-center gap-4 rounded-2xl border p-5 transition hover:opacity-80"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                animationDelay: "0.2s",
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--color-primary)" }}>
                <Mail className="h-4 w-4" style={{ color: "var(--color-button-text)" }} />
              </div>
              <div>
                <p className="text-[0.625rem] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                  {lang === "ms" ? "E-mel" : "Email"}
                </p>
                <p className="font-body text-sm md:text-base" style={{ color: "var(--color-text)" }}>
                  {content.contact_email}
                </p>
              </div>
            </a>
          )}

          {/* Address */}
          {content.contact_address && (
            <div
              className="flex animate-fade-in-up items-start gap-4 rounded-2xl border p-5"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                animationDelay: "0.3s",
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--color-primary)" }}>
                <MapPin className="h-4 w-4" style={{ color: "var(--color-button-text)" }} />
              </div>
              <div>
                <p className="text-[0.625rem] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                  {lang === "ms" ? "Alamat" : "Address"}
                </p>
                <p className="font-body text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text)" }}>
                  {content.contact_address}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wedding location fallback */}
        {!content.contact_phone && !content.contact_email && !content.contact_address && wedding?.location && (
          <div
            className="flex animate-fade-in-up items-start gap-4 rounded-2xl border p-5"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              animationDelay: "0.1s",
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--color-primary)" }}>
              <MapPin className="h-4 w-4" style={{ color: "var(--color-button-text)" }} />
            </div>
            <div>
              <p className="text-[0.625rem] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                {lang === "ms" ? "Lokasi" : "Location"}
              </p>
              <p className="font-body text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text)" }}>
                {wedding.location}
              </p>
            </div>
          </div>
        )}

        {/* Closing */}
        <div className="mt-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-px w-6" style={{ background: "var(--color-border)" }} />
            <Heart className="h-3 w-3" style={{ color: "var(--color-accent)", opacity: 0.5 }} />
            <div className="h-px w-6" style={{ background: "var(--color-border)" }} />
          </div>
          <p className="font-body text-sm font-light italic" style={{ color: "var(--color-text-muted)" }}>
            {lang === "ms"
              ? "Kami menantikan kehadiran anda."
              : "We look forward to celebrating with you."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Contact;

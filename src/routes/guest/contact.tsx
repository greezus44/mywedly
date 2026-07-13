import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getLogoConfig, getLogoStyle, shouldShowLogo } from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";
import { Phone, Mail, MapPin } from "lucide-react";

export function Contact() {
  const { slug } = useParams<{ slug: string }>();
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
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
  const showLogo = shouldShowLogo(logo, "contact");

  const phone = content.contact_phone ? String(content.contact_phone) : "";
  const email = content.contact_email ? String(content.contact_email) : "";
  const address = content.contact_address ? String(content.contact_address) : "";

  return (
    <div
      className="min-h-screen px-6 py-12 md:py-16"
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

        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "var(--color-text-muted)" }}>
            {lang === "en" ? "Get In Touch" : "Hubungi Kami"}
          </p>
          <h1
            className="font-heading"
            style={{ color: "var(--color-primary)", fontSize: "2.5rem", fontWeight: 400, letterSpacing: "-0.01em" }}
          >
            {t.contact}
          </h1>
        </div>

        {/* Contact cards */}
        <div className="space-y-4">
          {/* Phone */}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-4 rounded-2xl border p-5 transition-all hover:scale-[1.02] animate-fade-in-up"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                animationDelay: "0.1s",
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: "var(--color-button-bg)" }}
              >
                <Phone className="w-4 h-4" style={{ color: "var(--color-button-text)" }} />
              </div>
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
                  {lang === "en" ? "Phone" : "Telefon"}
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  {phone}
                </p>
              </div>
            </a>
          )}

          {/* Email */}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-4 rounded-2xl border p-5 transition-all hover:scale-[1.02] animate-fade-in-up"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                animationDelay: "0.15s",
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: "var(--color-button-bg)" }}
              >
                <Mail className="w-4 h-4" style={{ color: "var(--color-button-text)" }} />
              </div>
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
                  {lang === "en" ? "Email" : "E-mel"}
                </p>
                <p className="text-sm font-medium break-all" style={{ color: "var(--color-text)" }}>
                  {email}
                </p>
              </div>
            </a>
          )}

          {/* Address */}
          {address && (
            <div
              className="flex items-start gap-4 rounded-2xl border p-5 animate-fade-in-up"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                animationDelay: "0.2s",
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full flex-shrink-0"
                style={{ background: "var(--color-button-bg)" }}
              >
                <MapPin className="w-4 h-4" style={{ color: "var(--color-button-text)" }} />
              </div>
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
                  {lang === "en" ? "Address" : "Alamat"}
                </p>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-line" style={{ color: "var(--color-text)" }}>
                  {address}
                </p>
              </div>
            </div>
          )}

          {/* No contact info */}
          {!phone && !email && !address && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {lang === "en" ? "No contact information available." : "Tiada maklumat hubungan tersedia."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Contact;

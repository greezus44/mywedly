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
import { Phone, Mail, MapPin, Heart } from "lucide-react";

export function Contact() {
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
  const showLogo = shouldShowLogo(logo, "contact") && logo.url;

  const hasContact =
    Boolean(content.contact_phone) ||
    Boolean(content.contact_email) ||
    Boolean(content.contact_address);

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

        <p
          className="mb-4 text-center font-body text-xs uppercase tracking-[0.3em] text-gray-400 animate-fade-in-up"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          {lang === "ms" ? "Hubungi Kami" : "Get in Touch"}
        </p>
        <h1
          className="text-center font-heading text-3xl font-light md:text-5xl animate-fade-in-up"
          style={{
            animationDelay: "0.3s",
            opacity: 0,
            color: "var(--color-text)",
            fontFamily: "var(--font-heading)",
          }}
        >
          {lang === "ms" ? "Hubungi" : "Contact"}
        </h1>

        {/* Divider */}
        <div className="mx-auto mt-8 flex items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <div className="h-px w-10 bg-gray-200" />
          <Heart className="h-3 w-3 text-gray-300" />
          <div className="h-px w-10 bg-gray-200" />
        </div>
      </section>

      {/* Contact info */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-lg">
          {hasContact ? (
            <div className="space-y-6">
              {/* Phone */}
              {content.contact_phone && (
                <a
                  href={`tel:${content.contact_phone}`}
                  className="flex animate-fade-in-up items-center gap-4 border border-gray-200 bg-white p-5 transition-all hover:shadow-sm"
                  style={{ animationDelay: "0.2s", opacity: 0, borderRadius: "0px" }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-200">
                    <Phone className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-[0.6rem] uppercase tracking-[0.2em] text-gray-400">
                      {lang === "ms" ? "Telefon" : "Phone"}
                    </p>
                    <p className="mt-1 truncate font-body text-sm text-gray-700">
                      {content.contact_phone}
                    </p>
                  </div>
                </a>
              )}

              {/* Email */}
              {content.contact_email && (
                <a
                  href={`mailto:${content.contact_email}`}
                  className="flex animate-fade-in-up items-center gap-4 border border-gray-200 bg-white p-5 transition-all hover:shadow-sm"
                  style={{ animationDelay: "0.3s", opacity: 0, borderRadius: "0px" }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-200">
                    <Mail className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-[0.6rem] uppercase tracking-[0.2em] text-gray-400">
                      {lang === "ms" ? "E-mel" : "Email"}
                    </p>
                    <p className="mt-1 truncate font-body text-sm text-gray-700">
                      {content.contact_email}
                    </p>
                  </div>
                </a>
              )}

              {/* Address */}
              {content.contact_address && (
                <div
                  className="flex animate-fade-in-up items-start gap-4 border border-gray-200 bg-white p-5"
                  style={{ animationDelay: "0.4s", opacity: 0, borderRadius: "0px" }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-200">
                    <MapPin className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-[0.6rem] uppercase tracking-[0.2em] text-gray-400">
                      {lang === "ms" ? "Alamat" : "Address"}
                    </p>
                    <p className="mt-1 font-body text-sm leading-relaxed text-gray-700">
                      {content.contact_address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center font-body text-sm text-gray-400">
              {lang === "ms"
                ? "Maklumat hubungan tidak tersedia."
                : "Contact information is not available."}
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Heart className="mx-auto mb-4 h-5 w-5 text-gray-300" />
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gray-400">
            {wedding?.couple_name_one || ""} & {wedding?.couple_name_two || ""}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Contact;

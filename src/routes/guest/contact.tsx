import { Phone, Mail, MapPin } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getContent } from "../../lib/theme";

export function Contact() {
  const { session } = useGuestAuth();
  const { t } = useLang();

  const wedding = session?.wedding || null;
  const theme = getTheme(wedding);
  const cssVars = themeToCssVars(theme);
  const content = getContent(wedding!);

  if (!wedding) return null;

  const phone = content.contact_phone || wedding.contact_phone || null;
  const email = content.contact_email || null;
  const address = content.contact_address || wedding.location || null;

  const hasAny = phone || email || address;

  return (
    <div style={cssVars} className="bg-[var(--color-bg)] min-h-screen pb-20">
      {/* Header */}
      <section className="max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-10 text-center">
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-4 animate-fade-in-down opacity-0-init">
          {t("contact")}
        </p>
        <h1 className="font-script text-4xl md:text-5xl text-[var(--color-primary)] mb-6 animate-fade-in-up opacity-0-init delay-100">
          {t("contact")}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
          <div className="w-1.5 h-1.5 rounded-full border border-[var(--color-border)]/40" />
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
        </div>
      </section>

      {/* Contact details */}
      {hasAny ? (
        <section className="max-w-xl mx-auto px-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg px-8 py-12 md:px-12 md:py-16 animate-fade-in-up opacity-0-init delay-200" style={{ borderRadius: "var(--button-radius, 8px)" }}>
            <div className="flex flex-col gap-8">
              {/* Phone */}
              {phone && (
                <div className="flex flex-col items-center text-center animate-fade-in-up opacity-0-init delay-300">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[var(--color-border)]/30 mb-4">
                    <Phone size={20} className="text-[var(--color-primary)]" />
                  </div>
                  <p className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-text-muted)] mb-2">
                    {t("contact")}
                  </p>
                  <a
                    href={`tel:${phone}`}
                    className="font-body text-lg text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {phone}
                  </a>
                </div>
              )}

              {/* Divider */}
              {phone && email && (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-10 bg-[var(--color-border)]/20" />
                  <div className="w-1 h-1 rounded-full bg-[var(--color-border)]/30" />
                  <div className="h-px w-10 bg-[var(--color-border)]/20" />
                </div>
              )}

              {/* Email */}
              {email && (
                <div className="flex flex-col items-center text-center animate-fade-in-up opacity-0-init delay-400">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[var(--color-border)]/30 mb-4">
                    <Mail size={20} className="text-[var(--color-primary)]" />
                  </div>
                  <p className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-text-muted)] mb-2">
                    Email
                  </p>
                  <a
                    href={`mailto:${email}`}
                    className="font-body text-lg text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors break-all"
                  >
                    {email}
                  </a>
                </div>
              )}

              {/* Divider */}
              {email && address && (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-10 bg-[var(--color-border)]/20" />
                  <div className="w-1 h-1 rounded-full bg-[var(--color-border)]/30" />
                  <div className="h-px w-10 bg-[var(--color-border)]/20" />
                </div>
              )}

              {/* Address */}
              {address && (
                <div className="flex flex-col items-center text-center animate-fade-in-up opacity-0-init delay-500">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[var(--color-border)]/30 mb-4">
                    <MapPin size={20} className="text-[var(--color-primary)]" />
                  </div>
                  <p className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-text-muted)] mb-2">
                    {t("address")}
                  </p>
                  <p className="font-body text-lg text-[var(--color-text)] leading-relaxed whitespace-pre-line">
                    {address}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <p className="font-heading text-xl text-[var(--color-text-muted)] italic">
            {t("error")}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-6 pt-16 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-16 bg-[var(--color-border)]/30" />
          <div className="w-2 h-2 rounded-full border border-[var(--color-border)]/40" />
          <div className="h-px w-16 bg-[var(--color-border)]/30" />
        </div>
        <p className="font-script text-2xl text-[var(--color-primary)]">
          {wedding.couple_name_one} & {wedding.couple_name_two}
        </p>
      </div>
    </div>
  );
}

export default Contact;

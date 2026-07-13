import { Phone, Mail, MapPin } from "lucide-react";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, getCoverContent } from "../../lib/theme";

export function Contact() {
  const { t } = useLang();
  const { session } = useGuestAuth();
  const wedding = session?.wedding;

  if (!wedding) return null;

  const theme = getTheme(wedding);
  const content = getCoverContent(wedding);
  const phone = content.contact_phone || wedding.contact_phone || null;
  const email = content.contact_email || null;
  const address = content.contact_address || wedding.location || null;

  const hasAny = phone || email || address;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]" style={themeToCssVars(theme) as React.CSSProperties}>
      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28 flex flex-col items-center text-center">
        {/* Header */}
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-4 opacity-0-init animate-fade-in">
          {t("contact")}
        </p>
        <h1 className="font-script text-4xl md:text-5xl text-[var(--color-text)] mb-6 opacity-0-init animate-fade-in-up delay-100">
          {t("contact")}
        </h1>
        <div className="flex items-center justify-center gap-2 mb-14 opacity-0-init animate-fade-in delay-200">
          <span className="h-px w-12 bg-[var(--color-border)]/40" />
          <span className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-primary)]">♡</span>
          <span className="h-px w-12 bg-[var(--color-border)]/40" />
        </div>

        {hasAny ? (
          <div className="space-y-10 max-w-md w-full">
            {/* Phone */}
            {phone && (
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="flex flex-col items-center group opacity-0-init animate-fade-in-up delay-300"
              >
                <div className="w-14 h-14 flex items-center justify-center rounded-full border border-[var(--color-border)]/30 mb-4 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                  <Phone size={20} className="text-[var(--color-primary)] group-hover:text-white transition-colors" />
                </div>
                <p className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-text-muted)] mb-1">
                  {t("contact")}
                </p>
                <p className="font-heading text-xl text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                  {phone}
                </p>
              </a>
            )}

            {/* Email */}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex flex-col items-center group opacity-0-init animate-fade-in-up delay-400"
              >
                <div className="w-14 h-14 flex items-center justify-center rounded-full border border-[var(--color-border)]/30 mb-4 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                  <Mail size={20} className="text-[var(--color-primary)] group-hover:text-white transition-colors" />
                </div>
                <p className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-text-muted)] mb-1">
                  Email
                </p>
                <p className="font-heading text-xl text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors break-all">
                  {email}
                </p>
              </a>
            )}

            {/* Address */}
            {address && (
              <div className="flex flex-col items-center opacity-0-init animate-fade-in-up delay-500">
                <div className="w-14 h-14 flex items-center justify-center rounded-full border border-[var(--color-border)]/30 mb-4">
                  <MapPin size={20} className="text-[var(--color-primary)]" />
                </div>
                <p className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-text-muted)] mb-1">
                  {t("address")}
                </p>
                <p className="font-heading text-xl text-[var(--color-text)] max-w-xs whitespace-pre-line">
                  {address}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="font-body text-lg text-[var(--color-text-muted)] opacity-0-init animate-fade-in-up delay-300">
            {t("contact")}
          </p>
        )}
      </div>
    </div>
  );
}

export default Contact;

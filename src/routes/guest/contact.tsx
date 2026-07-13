import { Phone, Mail, MapPin } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { getTheme, themeToCssVars } from "../../lib/theme";

export function Contact() {
  const { session } = useGuestAuth();
  const { t } = useLang();

  if (!session) return null;

  const { wedding } = session;
  const theme = getTheme(wedding);
  const content = (wedding.content || {}) as Record<string, unknown>;
  const draftContent = (wedding.draft_content || {}) as Record<string, never>;
  const c = { ...content, ...draftContent };

  const phone = (c.contact_phone as string) || wedding.contact_phone || "";
  const email = (c.contact_email as string) || "";
  const address = (c.contact_address as string) || wedding.location || "";

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-16"
      style={themeToCssVars(theme) as React.CSSProperties}
    >
      <div className="max-w-xl w-full text-center">
        {/* Header */}
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-4 opacity-0-init animate-fade-in">
          {t("invitation")}
        </p>

        <h1 className="font-script text-4xl md:text-5xl text-[var(--color-text)] mb-6 opacity-0-init animate-fade-in-up">
          {t("contact")}
        </h1>

        <div className="flex items-center justify-center gap-4 mb-12 opacity-0-init animate-fade-in-up delay-100">
          <span className="h-px w-12 bg-[var(--color-primary)]/30" />
          <span className="text-[var(--color-primary)] text-xs">✦</span>
          <span className="h-px w-12 bg-[var(--color-primary)]/30" />
        </div>

        {/* Contact cards */}
        <div className="space-y-4">
          {/* Phone */}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-primary)]/15 p-5 hover:border-[var(--color-primary)]/40 transition-colors opacity-0-init animate-fade-in-up delay-200"
              style={{ borderRadius: "8px" }}
            >
              <div
                className="flex items-center justify-center w-12 h-12 bg-[var(--color-primary)]/10 shrink-0"
                style={{ borderRadius: "8px" }}
              >
                <Phone size={20} className="text-[var(--color-primary)]" />
              </div>
              <div className="text-left">
                <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                  {t("contact")}
                </p>
                <p className="font-heading text-lg text-[var(--color-text)]">{phone}</p>
              </div>
            </a>
          )}

          {/* Email */}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-primary)]/15 p-5 hover:border-[var(--color-primary)]/40 transition-colors opacity-0-init animate-fade-in-up delay-300"
              style={{ borderRadius: "8px" }}
            >
              <div
                className="flex items-center justify-center w-12 h-12 bg-[var(--color-primary)]/10 shrink-0"
                style={{ borderRadius: "8px" }}
              >
                <Mail size={20} className="text-[var(--color-primary)]" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                  {t("contact")}
                </p>
                <p className="font-heading text-lg text-[var(--color-text)] truncate">{email}</p>
              </div>
            </a>
          )}

          {/* Address */}
          {address && (
            <div
              className="flex items-start gap-4 bg-[var(--color-surface)] border border-[var(--color-primary)]/15 p-5 opacity-0-init animate-fade-in-up delay-400"
              style={{ borderRadius: "8px" }}
            >
              <div
                className="flex items-center justify-center w-12 h-12 bg-[var(--color-primary)]/10 shrink-0"
                style={{ borderRadius: "8px" }}
              >
                <MapPin size={20} className="text-[var(--color-primary)]" />
              </div>
              <div className="text-left">
                <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                  {t("address")}
                </p>
                <p className="font-body text-base text-[var(--color-text)] leading-relaxed">
                  {address}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Closing decorative line */}
        <div className="flex items-center justify-center gap-4 mt-12 opacity-0-init animate-fade-in-up delay-500">
          <span className="h-px w-16 bg-[var(--color-primary)]/30" />
          <span className="text-[var(--color-primary)] text-xs">✦</span>
          <span className="h-px w-16 bg-[var(--color-primary)]/30" />
        </div>
      </div>
    </div>
  );
}

export default Contact;

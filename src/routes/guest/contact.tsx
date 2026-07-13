import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getCoverContent } from "../../lib/theme";
import { Phone, Mail, MapPin } from "lucide-react";

export function Contact() {
  const { session } = useGuestAuth();
  const { lang } = useLang();

  if (!session) return null;

  const { wedding } = session;
  const content = getCoverContent(wedding);
  const theme = wedding.theme_config && "colors" in wedding.theme_config ? wedding.theme_config : null;

  const phone = content.contact_phone || wedding.contact_phone;
  const email = content.contact_email;
  const address = content.contact_address;

  return (
    <div
      style={themeToCssVars(theme) as React.CSSProperties}
      className="min-h-full bg-[var(--color-bg)] py-16 md:py-24 px-6"
    >
      <div className="max-w-lg mx-auto text-center">
        {/* Header */}
        <h2 className="font-heading text-3xl md:text-4xl text-[var(--color-primary)] mb-3 animate-fade-in-up opacity-0-init">
          {t_contact("contact", lang)}
        </h2>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center gap-3 mb-12 animate-fade-in opacity-0-init delay-100">
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
        </div>

        {/* Contact Items */}
        <div className="space-y-8">
          {/* Phone */}
          {phone && (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="flex flex-col items-center group animate-fade-in-up opacity-0-init delay-200"
            >
              <div className="w-12 h-12 rounded-full border border-[var(--color-border)]/30 flex items-center justify-center mb-3 group-hover:border-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/5 transition-all">
                <Phone size={18} className="text-[var(--color-primary)]" />
              </div>
              <span className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-text-muted)] mb-1">
                {t_contact("phone", lang)}
              </span>
              <span className="font-ui text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                {phone}
              </span>
            </a>
          )}

          {/* Email */}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex flex-col items-center group animate-fade-in-up opacity-0-init delay-300"
            >
              <div className="w-12 h-12 rounded-full border border-[var(--color-border)]/30 flex items-center justify-center mb-3 group-hover:border-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/5 transition-all">
                <Mail size={18} className="text-[var(--color-primary)]" />
              </div>
              <span className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-text-muted)] mb-1">
                {t_contact("email", lang)}
              </span>
              <span className="font-ui text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors break-all">
                {email}
              </span>
            </a>
          )}

          {/* Address */}
          {address && (
            <div className="flex flex-col items-center animate-fade-in-up opacity-0-init delay-400">
              <div className="w-12 h-12 rounded-full border border-[var(--color-border)]/30 flex items-center justify-center mb-3">
                <MapPin size={18} className="text-[var(--color-primary)]" />
              </div>
              <span className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-text-muted)] mb-1">
                {t_contact("address", lang)}
              </span>
              <span className="font-body text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-line max-w-xs">
                {address}
              </span>
            </div>
          )}
        </div>

        {/* Fallback if no contact info */}
        {!phone && !email && !address && (
          <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted)] py-8">
            {lang === "ms" ? "Maklumat hubungan tidak tersedia" : "No contact information available"}
          </p>
        )}

        {/* Closing decorative element */}
        <div className="mt-16 flex items-center justify-center gap-3 animate-fade-in opacity-0-init delay-500">
          <div className="h-px w-16 bg-[var(--color-border)]/20" />
          <span className="font-script text-lg text-[var(--color-primary)]/40">❦</span>
          <div className="h-px w-16 bg-[var(--color-border)]/20" />
        </div>
      </div>
    </div>
  );
}

function t_contact(key: string, lang: "en" | "ms"): string {
  const map: Record<string, { en: string; ms: string }> = {
    contact: { en: "Contact", ms: "Hubungi" },
    phone: { en: "Telephone", ms: "Telefon" },
    email: { en: "Email", ms: "E-mel" },
    address: { en: "Address", ms: "Alamat" },
  };
  return map[key]?.[lang] || key;
}

export default Contact;

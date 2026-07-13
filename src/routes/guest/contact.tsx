import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Phone, Mail, MapPin, Heart } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, coverToCssVars, getTheme, getCoverConfig, getCoverContent, getLogoConfig, getLogoStyle } from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";

export function Contact() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session } = useGuestAuth();
  const { t } = useLang();

  useEffect(() => {
    if (!session) navigate(`/w/${slug}/login`, { replace: true });
  }, [session, slug, navigate]);

  if (!session) return null;

  const wedding = session.wedding;
  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const content = getCoverContent(wedding);
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();

  const showLogo = logo.visible && logo.url && (logo.showOnPages === "all-pages" || (logo.showOnPages === "custom" && logo.customPages.includes("contact")));

  const phone = content.contact_phone || wedding.contact_phone;
  const email = content.contact_email;
  const address = content.contact_address || wedding.location;

  return (
    <div
      className="min-h-screen px-6 py-12 md:py-20"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as React.CSSProperties}
    >
      <div className="max-w-2xl mx-auto text-center">
        {showLogo && (
          <div className="flex justify-center mb-8 animate-fade-in">
            <img src={logo.url!} alt="Logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        <div className="animate-fade-in-up">
          <h1 className="font-script text-4xl text-[var(--color-primary)] mb-3">{t("contact")}</h1>

          <div className="flex items-center justify-center gap-3 my-6">
            <div className="h-px w-16 bg-[var(--color-primary)]/30" />
            <Heart size={18} className="text-[var(--color-primary)]" />
            <div className="h-px w-16 bg-[var(--color-primary)]/30" />
          </div>

          <div className="space-y-6 mt-10">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex flex-col items-center gap-2 p-6 bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg hover:border-[var(--color-primary)]/50 transition-all animate-fade-in-up opacity-0-init delay-200"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Phone size={20} className="text-[var(--color-primary)]" />
                </div>
                <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{t("contact")}</p>
                <p className="font-body text-lg text-[var(--color-text)]">{phone}</p>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="flex flex-col items-center gap-2 p-6 bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg hover:border-[var(--color-primary)]/50 transition-all animate-fade-in-up opacity-0-init delay-300"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Mail size={20} className="text-[var(--color-primary)]" />
                </div>
                <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Email</p>
                <p className="font-body text-lg text-[var(--color-text)]">{email}</p>
              </a>
            )}

            {address && (
              <div className="flex flex-col items-center gap-2 p-6 bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg animate-fade-in-up opacity-0-init delay-400">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <MapPin size={20} className="text-[var(--color-primary)]" />
                </div>
                <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{t("address")}</p>
                <p className="font-body text-lg text-[var(--color-text)]">{address}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;

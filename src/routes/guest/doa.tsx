import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, coverToCssVars, getTheme, getCoverConfig, getCoverContent, getLogoConfig, getLogoStyle } from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";

export function Doa() {
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

  const showLogo = logo.visible && logo.url && (logo.showOnPages === "all-pages" || (logo.showOnPages === "custom" && logo.customPages.includes("doa")));

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
          <p className="font-script text-xl text-[var(--color-primary)] mb-6">
            {t("bismillah")}
          </p>

          <h1 className="font-script text-4xl text-[var(--color-primary)] mb-8">
            {content.doa_title || t("doa")}
          </h1>

          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-[var(--color-primary)]/30" />
            <Heart size={18} className="text-[var(--color-primary)]" />
            <div className="h-px w-16 bg-[var(--color-primary)]/30" />
          </div>

          {content.doa_body && (
            <p className="font-body text-lg text-[var(--color-text)] leading-relaxed whitespace-pre-line mb-10">
              {content.doa_body}
            </p>
          )}

          {content.invitation_closing && (
            <p className="font-body text-base text-[var(--color-text-muted)] italic mt-10">
              {content.invitation_closing}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Doa;

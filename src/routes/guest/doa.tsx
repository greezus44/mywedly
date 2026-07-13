import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, getCoverContent } from "../../lib/theme";

export function Doa() {
  const { t } = useLang();
  const { session } = useGuestAuth();
  const wedding = session?.wedding;

  if (!wedding) return null;

  const theme = getTheme(wedding);
  const content = getCoverContent(wedding);
  const title = content.doa_title || t("doa");
  const body = content.doa_body || "";
  const imageUrl = content.doa_image_url || null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]" style={themeToCssVars(theme) as React.CSSProperties}>
      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28 flex flex-col items-center text-center">
        {/* Section label */}
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-6 opacity-0-init animate-fade-in">
          {t("doa")}
        </p>

        {/* Title */}
        <h1 className="font-script text-4xl md:text-5xl text-[var(--color-text)] mb-6 opacity-0-init animate-fade-in-up delay-100">
          {title}
        </h1>

        {/* Divider */}
        <div className="flex items-center justify-center gap-2 mb-10 opacity-0-init animate-fade-in delay-200">
          <span className="h-px w-12 bg-[var(--color-border)]/40" />
          <span className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-primary)]">♡</span>
          <span className="h-px w-12 bg-[var(--color-border)]/40" />
        </div>

        {/* Image */}
        {imageUrl && (
          <div className="mb-12 max-w-sm opacity-0-init animate-fade-in-up delay-300">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-auto rounded-xl shadow-[0_4px_24px_rgba(184,151,58,0.12)]"
              style={{ borderRadius: "var(--button-radius, 8px)" }}
            />
          </div>
        )}

        {/* Body */}
        {body && (
          <div className="max-w-lg opacity-0-init animate-fade-in-up delay-300">
            <p className="font-body text-lg md:text-xl leading-relaxed text-[var(--color-text)] whitespace-pre-line">
              {body}
            </p>
          </div>
        )}

        {/* Closing flourish */}
        <div className="mt-16 opacity-0-init animate-fade-in delay-500">
          <span className="font-script text-2xl text-[var(--color-primary)]">آمين</span>
        </div>
      </div>
    </div>
  );
}

export default Doa;

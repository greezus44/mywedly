import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getContent } from "../../lib/theme";

export function Doa() {
  const { session } = useGuestAuth();
  const { t } = useLang();

  const wedding = session?.wedding || null;
  const theme = getTheme(wedding);
  const cssVars = themeToCssVars(theme);
  const content = getContent(wedding!);

  if (!wedding) return null;

  const title = content.doa_title || t("doa");
  const body = content.doa_body || "";
  const imageUrl = content.doa_image_url || null;

  return (
    <div style={cssVars} className="bg-[var(--color-bg)] min-h-screen pb-20">
      {/* Header */}
      <section className="max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-10 text-center">
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-4 animate-fade-in-down opacity-0-init">
          {t("doa")}
        </p>
        <h1 className="font-script text-4xl md:text-5xl text-[var(--color-primary)] mb-6 animate-fade-in-up opacity-0-init delay-100">
          {title}
        </h1>
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
          <div className="w-1.5 h-1.5 rounded-full border border-[var(--color-border)]/40" />
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
        </div>
      </section>

      {/* Image */}
      {imageUrl && (
        <div className="max-w-2xl mx-auto px-6 mb-10 animate-fade-in-up opacity-0-init delay-200">
          <img
            src={imageUrl}
            alt={title}
            className="w-full max-h-[400px] object-cover rounded-lg shadow-[var(--shadow-soft)]"
            style={{ borderRadius: "var(--button-radius, 8px)" }}
          />
        </div>
      )}

      {/* Prayer body */}
      {body && (
        <section className="max-w-2xl mx-auto px-6 py-8 text-center">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg px-8 py-12 md:px-12 md:py-16 animate-fade-in-up opacity-0-init delay-300" style={{ borderRadius: "var(--button-radius, 8px)" }}>
            <p className="font-heading text-xl md:text-2xl text-[var(--color-text)] leading-relaxed whitespace-pre-line">
              {body}
            </p>
          </div>
        </section>
      )}

      {/* Decorative footer */}
      <div className="max-w-2xl mx-auto px-6 pt-12 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-[var(--color-border)]/30" />
          <div className="w-2 h-2 rounded-full border border-[var(--color-border)]/40" />
          <div className="h-px w-16 bg-[var(--color-border)]/30" />
        </div>
        <p className="font-script text-2xl text-[var(--color-primary)] mt-6">
          {wedding.couple_name_one} & {wedding.couple_name_two}
        </p>
      </div>
    </div>
  );
}

export default Doa;

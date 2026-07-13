import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getCoverContent } from "../../lib/theme";

export function Doa() {
  const { session } = useGuestAuth();
  const { lang } = useLang();

  if (!session) return null;

  const { wedding } = session;
  const content = getCoverContent(wedding);
  const theme = wedding.theme_config && "colors" in wedding.theme_config ? wedding.theme_config : null;

  return (
    <div
      style={themeToCssVars(theme) as React.CSSProperties}
      className="min-h-full bg-[var(--color-bg)] py-16 md:py-24 px-6"
    >
      <div className="max-w-2xl mx-auto text-center">
        {/* Title */}
        <h2 className="font-heading text-3xl md:text-4xl text-[var(--color-primary)] mb-3 animate-fade-in-up opacity-0-init">
          {content.doa_title || (lang === "ms" ? "Doa" : "Doa")}
        </h2>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center gap-3 mb-10 animate-fade-in opacity-0-init delay-100">
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
        </div>

        {/* Doa Image */}
        {content.doa_image_url && (
          <div className="mb-10 animate-fade-in-up opacity-0-init delay-200">
            <img
              src={content.doa_image_url}
              alt=""
              className="w-full max-w-md mx-auto rounded-lg shadow-[var(--shadow-card)]"
            />
          </div>
        )}

        {/* Doa Body */}
        {content.doa_body && (
          <p className="font-body text-base md:text-lg text-[var(--color-text)] leading-relaxed whitespace-pre-line animate-fade-in-up opacity-0-init delay-300">
            {content.doa_body}
          </p>
        )}

        {/* Bismillah if no specific doa body */}
        {!content.doa_body && (
          <p className="font-heading text-lg md:text-xl text-[var(--color-primary)] italic leading-relaxed animate-fade-in-up opacity-0-init delay-300">
            {lang === "ms"
              ? "Dengan nama Allah, Yang Maha Pemurah, Yang Maha Penyayang"
              : "In the name of Allah, the Most Gracious, the Most Merciful"}
          </p>
        )}

        {/* Closing decorative element */}
        <div className="mt-12 flex items-center justify-center gap-3 animate-fade-in opacity-0-init delay-500">
          <div className="h-px w-16 bg-[var(--color-border)]/20" />
          <span className="font-script text-lg text-[var(--color-primary)]/40">❦</span>
          <div className="h-px w-16 bg-[var(--color-border)]/20" />
        </div>
      </div>
    </div>
  );
}

export default Doa;

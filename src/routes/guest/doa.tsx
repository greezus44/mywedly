import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { getTheme, themeToCssVars } from "../../lib/theme";

export function Doa() {
  const { session } = useGuestAuth();
  const { t } = useLang();

  if (!session) return null;

  const { wedding } = session;
  const theme = getTheme(wedding);
  const content = (wedding.content || {}) as Record<string, unknown>;
  const draftContent = (wedding.draft_content || {}) as Record<string, never>;
  const c = { ...content, ...draftContent };

  const doaTitle = (c.doa_title as string) || t("doa");
  const doaBody = (c.doa_body as string) || "";
  const doaImage = (c.doa_image_url as string) || "";

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-16"
      style={themeToCssVars(theme) as React.CSSProperties}
    >
      <div className="max-w-2xl w-full text-center">
        {/* Label */}
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-4 opacity-0-init animate-fade-in">
          {t("invitation")}
        </p>

        {/* Title */}
        <h1 className="font-script text-4xl md:text-5xl text-[var(--color-text)] mb-6 opacity-0-init animate-fade-in-up">
          {doaTitle}
        </h1>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-10 opacity-0-init animate-fade-in-up delay-100">
          <span className="h-px w-12 bg-[var(--color-primary)]/30" />
          <span className="text-[var(--color-primary)] text-xs">✦</span>
          <span className="h-px w-12 bg-[var(--color-primary)]/30" />
        </div>

        {/* Image */}
        {doaImage && (
          <div className="mb-10 opacity-0-init animate-fade-in-up delay-200">
            <img
              src={doaImage}
              alt={doaTitle}
              className="w-full max-h-80 object-cover mx-auto"
              style={{ borderRadius: "8px" }}
            />
          </div>
        )}

        {/* Body */}
        {doaBody && (
          <div className="opacity-0-init animate-fade-in-up delay-300">
            {doaBody.split("\n").map((paragraph, i) => (
              <p
                key={i}
                className="font-body text-lg text-[var(--color-text)] leading-relaxed mb-6"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* Closing decorative line */}
        <div className="flex items-center justify-center gap-4 mt-10 opacity-0-init animate-fade-in-up delay-500">
          <span className="h-px w-16 bg-[var(--color-primary)]/30" />
          <span className="text-[var(--color-primary)] text-xs">✦</span>
          <span className="h-px w-16 bg-[var(--color-primary)]/30" />
        </div>
      </div>
    </div>
  );
}

export default Doa;

import type { UserEvent, CoverConfig, LoginConfig, EventContent } from "../../lib/supabase";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { formatDate, getCountdown } from "../../lib/utils";

export function CoverPreview({ event }: { event: UserEvent }) {
  const config = (event.draft_cover_config || event.cover_config || {}) as CoverConfig;
  const theme = event.draft_theme || event.theme || DEFAULT_THEME;
  const vars = themeToCssVars(theme) as React.CSSProperties;
  const bg = config.bgImage
    ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: config.bgColor || theme.bgColor };
  const dateStr = event.draft_event_date || event.event_date;
  const countdown = getCountdown(dateStr);

  return (
    <div style={{ ...vars, ...bg, minHeight: "100vh" }} className="flex flex-col items-center justify-center text-center p-8 relative">
      {config.bgImage && (
        <div className="absolute inset-0" style={{ backgroundColor: config.overlayColor || "#000", opacity: config.overlayOpacity ?? 0.4 }} />
      )}
      <div className="relative" style={{ color: config.textColor || theme.textColor }}>
        {config.customText && <p className="font-script italic text-lg mb-4 opacity-80">{config.customText}</p>}
        <h1 className="font-heading text-5xl md:text-6xl mb-2">{event.draft_name || event.name}</h1>
        {config.showDate && dateStr && <p className="text-sm uppercase tracking-widest mt-4 opacity-70">{formatDate(dateStr)}</p>}
        {config.showCountdown && !countdown.isPast && (
          <div className="flex gap-6 mt-8 justify-center">
            {["days", "hours", "minutes", "seconds"].map((u) => (
              <div key={u}>
                <div className="text-3xl font-heading">{(countdown as any)[u]}</div>
                <div className="text-xs uppercase tracking-wider mt-1 opacity-60">{u}</div>
              </div>
            ))}
          </div>
        )}
        <button
          className="mt-8 px-8 py-3 text-sm uppercase tracking-wider"
          style={{ backgroundColor: config.buttonColor || theme.primaryColor, color: "#fff", borderRadius: "var(--radius)" }}
        >
          {config.buttonText || "Enter"}
        </button>
      </div>
    </div>
  );
}

export function LoginPreview({ event }: { event: UserEvent }) {
  const config = (event.draft_login_config || event.login_config || {}) as LoginConfig;
  const theme = event.draft_theme || event.theme || DEFAULT_THEME;
  const vars = themeToCssVars(theme) as React.CSSProperties;
  const bg = config.bgImage
    ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: config.bgColor || theme.bgSubtleColor };

  return (
    <div style={{ ...vars, ...bg, minHeight: "100vh" }} className="flex flex-col items-center justify-center p-8">
      <div className="relative w-full max-w-sm text-center" style={{ color: config.textColor || theme.textColor }}>
        <h2 className="font-heading text-3xl mb-2">{config.heading || "Welcome"}</h2>
        {config.subheading && <p className="text-sm opacity-70 mb-6">{config.subheading}</p>}
        <input
          type="text"
          placeholder={config.inputPlaceholder || "Your name"}
          className="w-full px-4 py-2.5 text-sm border bg-white/80 mb-3"
          style={{ borderColor: theme.borderColor, borderRadius: "var(--radius)" }}
        />
        <button
          className="w-full px-6 py-2.5 text-sm uppercase tracking-wider"
          style={{ backgroundColor: config.buttonColor || theme.primaryColor, color: "#fff", borderRadius: "var(--radius)" }}
        >
          {config.buttonText || "Continue"}
        </button>
      </div>
    </div>
  );
}

export function HomePreview({ event }: { event: UserEvent }) {
  const theme = event.draft_theme || event.theme || DEFAULT_THEME;
  const vars = themeToCssVars(theme) as React.CSSProperties;
  const content = (event.draft_content || event.content || {}) as EventContent;
  const dateStr = event.draft_event_date || event.event_date;

  return (
    <div style={vars} className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto px-6 py-16 text-center" style={{ color: "var(--color-text)" }}>
        <p className="text-xs uppercase tracking-widest opacity-50 mb-3">{event.draft_event_type || event.event_type}</p>
        <h1 className="font-heading text-4xl md:text-5xl mb-4">{event.draft_name || event.name}</h1>
        {dateStr && <p className="text-sm uppercase tracking-wider opacity-70 mb-2">{formatDate(dateStr)}</p>}
        {event.draft_venue && <p className="text-sm opacity-70">{event.draft_venue}</p>}
      </div>
      {content.story && (
        <div className="max-w-2xl mx-auto px-6 py-12 text-center" style={{ color: "var(--color-text)" }}>
          <p className="font-script italic text-2xl mb-4 opacity-80">Our Story</p>
          <p className="text-sm leading-relaxed opacity-80">{content.story}</p>
        </div>
      )}
      {content.invitation_body && (
        <div className="max-w-2xl mx-auto px-6 py-12 text-center" style={{ color: "var(--color-text)" }}>
          <h2 className="font-heading text-3xl mb-4">{content.invitation_title || "You're Invited"}</h2>
          <p className="text-sm leading-relaxed opacity-80">{content.invitation_body}</p>
        </div>
      )}
    </div>
  );
}

export function RsvpPreview({ event }: { event: UserEvent }) {
  const theme = event.draft_theme || event.theme || DEFAULT_THEME;
  const vars = themeToCssVars(theme) as React.CSSProperties;

  return (
    <div style={vars} className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md text-center" style={{ color: "var(--color-text)" }}>
        <p className="font-script italic text-2xl mb-2 opacity-80">RSVP</p>
        <h2 className="font-heading text-3xl mb-6">Will you attend?</h2>
        <div className="flex gap-3 justify-center">
          <button className="px-8 py-3 text-sm uppercase tracking-wider" style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg)", borderRadius: "var(--radius)" }}>
            Joyfully Accepts
          </button>
          <button className="px-8 py-3 text-sm uppercase tracking-wider border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", borderRadius: "var(--radius)" }}>
            Regretfully Declines
          </button>
        </div>
      </div>
    </div>
  );
}

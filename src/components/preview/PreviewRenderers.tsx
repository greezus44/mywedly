import { type CSSProperties } from "react";
import type { UserEvent, CoverConfig, LoginConfig, ThemeConfig, EventContent } from "../../lib/supabase";
import { themeToEventCssVars } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";
import { formatTime } from "../../lib/utils";

function resolve<T>(draft: T | null | undefined, published: T | null | undefined): T | null {
  return draft ?? published ?? null;
}

function themedDiv(theme: ThemeConfig | null, extra?: CSSProperties) {
  return { style: { ...(themeToEventCssVars(theme) as CSSProperties), ...extra } };
}

/* ------------------------------------------------------------------ */
/* CoverPreview                                                        */
/* ------------------------------------------------------------------ */

export function CoverPreview({ event }: { event: UserEvent }) {
  const cfg = resolve<CoverConfig>(event.draft_cover_config, event.cover_config);
  const name = event.draft_name ?? event.name;
  const date = event.draft_event_date ?? event.event_date;
  const theme = resolve<ThemeConfig>(event.draft_theme, event.theme);

  const bg = cfg?.bgImage
    ? { backgroundImage: `url(${cfg.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: cfg?.bgColor || "#1a1a1a" };

  const overlay = cfg?.overlayColor
    ? { backgroundColor: cfg.overlayColor, opacity: cfg.overlayOpacity ?? 0.4 }
    : {};

  return (
    <div className="event-themed" {...themedDiv(theme)}>
      <div className="relative flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center" style={bg as CSSProperties}>
        <div className="absolute inset-0" style={overlay as CSSProperties} />
        <div className="relative z-10 flex flex-col items-center gap-3">
          {cfg?.logo && (
            <img
              src={cfg.logo}
              alt="logo"
              style={{ width: cfg.logoWidth ? `${cfg.logoWidth}px` : undefined }}
              className="mb-2"
            />
          )}
          {cfg?.customText && (
            <p
              style={{ color: cfg.textColor || "#fff", fontFamily: cfg.scriptFont ? `"${cfg.scriptFont}", serif` : undefined }}
              className="text-sm italic"
            >
              {cfg.customText}
            </p>
          )}
          <h1
            style={{ color: cfg?.textColor || "#fff", fontFamily: cfg?.scriptFont ? `"${cfg.scriptFont}", serif` : undefined }}
            className="text-3xl font-semibold"
          >
            {name || "Your Event Name"}
          </h1>
          {cfg?.showDate && date && (
            <p style={{ color: cfg?.textColor || "#fff" }} className="text-sm">
              {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
          {cfg?.buttonText && (
            <button
              type="button"
              style={{ backgroundColor: cfg?.buttonColor || "#fff", color: cfg?.textColor === "#fff" ? "#1a1a1a" : "#fff" }}
              className="mt-4 rounded px-6 py-2 text-sm font-medium"
            >
              {cfg.buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LoginPreview                                                        */
/* ------------------------------------------------------------------ */

export function LoginPreview({ event }: { event: UserEvent }) {
  const cfg = resolve<LoginConfig>(event.draft_login_config, event.login_config);
  const theme = resolve<ThemeConfig>(event.draft_theme, event.theme);

  const bg = cfg?.bgImage
    ? { backgroundImage: `url(${cfg.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: cfg?.bgColor || "#fafafa" };

  const overlay = cfg?.overlayColor
    ? { backgroundColor: cfg.overlayColor, opacity: cfg.overlayOpacity ?? 0.3 }
    : {};

  return (
    <div className="event-themed" {...themedDiv(theme)}>
      <div className="relative flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center" style={bg as CSSProperties}>
        <div className="absolute inset-0" style={overlay as CSSProperties} />
        <div className="relative z-10 flex w-full max-w-xs flex-col items-center gap-3">
          {cfg?.logo && (
            <img
              src={cfg.logo}
              alt="logo"
              style={{ width: cfg.logoWidth ? `${cfg.logoWidth}px` : undefined }}
              className="mb-2"
            />
          )}
          {cfg?.heading && (
            <h2 style={{ color: cfg?.textColor || "#1a1a1a" }} className="text-xl font-semibold">
              {cfg.heading}
            </h2>
          )}
          {cfg?.subheading && (
            <p style={{ color: cfg?.textColor || "#6b6b6b" }} className="text-sm">
              {cfg.subheading}
            </p>
          )}
          <input
            type="text"
            placeholder={cfg?.inputPlaceholder || "Your name"}
            disabled
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-400"
          />
          <button
            type="button"
            style={{ backgroundColor: cfg?.buttonColor || "#1a1a1a", color: "#fff" }}
            className="w-full rounded-md px-4 py-2 text-sm font-medium"
          >
            {cfg?.buttonText || "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HomePreview                                                         */
/* ------------------------------------------------------------------ */

export function HomePreview({ event }: { event: UserEvent }) {
  const content = resolve<EventContent>(event.draft_content, event.content);
  const theme = resolve<ThemeConfig>(event.draft_theme, event.theme);
  const name = event.draft_name ?? event.name;
  const date = event.draft_event_date ?? event.event_date;
  const time = event.draft_event_time ?? event.event_time;
  const venue = event.draft_venue ?? event.venue;

  return (
    <div className="event-themed" {...themedDiv(theme)}>
      <div className="flex flex-col items-center gap-6 px-6 py-10" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
        {content?.rich_title ? (
          <RichTextContent html={content.rich_title} />
        ) : (
          <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--event-font-heading)" }}>
            {name || "Your Event Name"}
          </h1>
        )}

        {content?.rich_subtitle ? (
          <RichTextContent html={content.rich_subtitle} />
        ) : null}

        {(date || time || venue) && (
          <div className="flex flex-col items-center gap-1 text-sm" style={{ color: "var(--event-text-muted)" }}>
            {date && <span>{new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>}
            {time && <span>{formatTime(time)}</span>}
            {venue && <span>{venue}</span>}
          </div>
        )}

        {content?.rich_body ? (
          <RichTextContent html={content.rich_body} />
        ) : content?.story ? (
          <p className="max-w-prose text-center text-sm" style={{ color: "var(--event-text-muted)" }}>
            {content.story}
          </p>
        ) : null}

        {content?.rsvp_button_text && (
          <button
            type="button"
            style={{ backgroundColor: "var(--event-primary)", color: "#fff", borderRadius: "var(--event-radius)" }}
            className="px-6 py-2 text-sm font-medium"
          >
            {content.rsvp_button_text}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RsvpPreview                                                         */
/* ------------------------------------------------------------------ */

export function RsvpPreview({ event }: { event: UserEvent }) {
  const content = resolve<EventContent>(event.draft_content, event.content);
  const theme = resolve<ThemeConfig>(event.draft_theme, event.theme);
  const deadline = event.draft_rsvp_deadline ?? event.rsvp_deadline;

  return (
    <div className="event-themed" {...themedDiv(theme)}>
      <div className="flex flex-col items-center gap-4 px-6 py-10" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
        <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--event-font-heading)" }}>
          {content?.invitation_title || "RSVP"}
        </h2>
        {content?.invitation_subtitle && (
          <p className="text-sm" style={{ color: "var(--event-text-muted)" }}>
            {content.invitation_subtitle}
          </p>
        )}
        {content?.invitation_body && (
          <p className="max-w-prose text-center text-sm" style={{ color: "var(--event-text-muted)" }}>
            {content.invitation_body}
          </p>
        )}
        <div className="flex w-full max-w-xs flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              style={{ backgroundColor: "var(--event-primary)", color: "#fff", borderRadius: "var(--event-radius)" }}
              className="flex-1 px-4 py-2 text-sm font-medium"
            >
              Attending
            </button>
            <button
              type="button"
              style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text)", border: "1px solid var(--event-border)", borderRadius: "var(--event-radius)" }}
              className="flex-1 px-4 py-2 text-sm font-medium"
            >
              Decline
            </button>
          </div>
          <textarea
            placeholder="Leave a message (optional)"
            disabled
            className="min-h-[60px] w-full rounded-md border px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text-muted)", borderColor: "var(--event-border)" }}
          />
          {deadline && (
            <p className="text-center text-xs" style={{ color: "var(--event-text-muted)" }}>
              RSVP by {new Date(deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

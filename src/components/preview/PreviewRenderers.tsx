import { useMemo } from "react";
import type { UserEvent } from "../../lib/supabase";
import {
  themeToEventCssVars,
  DEFAULT_THEME,
} from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import {
  formatDate,
  formatTime12,
  getCountdown,
} from "../../lib/utils";
import { RichTextContent } from "../../lib/sanitize";

// ---------------------------------------------------------------------------
// Helpers — resolve draft_* with fallback to published values
// ---------------------------------------------------------------------------

function resolve<T>(draft: T | null | undefined, published: T | null | undefined): T | null {
  return draft ?? published ?? null;
}

function useResolvedEvent(event: UserEvent) {
  return useMemo(() => {
    const theme = resolve(event.draft_theme, event.theme) ?? DEFAULT_THEME;
    const coverConfig = resolve(event.draft_cover_config, event.cover_config);
    const loginConfig = resolve(event.draft_login_config, event.login_config);
    const content = resolve(event.draft_content, event.content);
    const sharingConfig = resolve(event.draft_sharing_config, event.sharing_config);
    const name = resolve(event.draft_name, event.name) ?? "Untitled Event";
    const eventType = resolve(event.draft_event_type, event.event_type) ?? "Event";
    const eventDate = resolve(event.draft_event_date, event.event_date);
    const eventTime = resolve(event.draft_event_time, event.event_time);
    const venue = resolve(event.draft_venue, event.venue);
    const address = resolve(event.draft_address, event.address);
    const coverImage = resolve(event.draft_cover_image, event.cover_image);
    const slug = resolve(event.draft_slug, event.slug);
    const rsvpDeadline = resolve(event.draft_rsvp_deadline, event.rsvp_deadline);

    return {
      theme,
      coverConfig,
      loginConfig,
      content,
      sharingConfig,
      name,
      eventType,
      eventDate,
      eventTime,
      venue,
      address,
      coverImage,
      slug,
      rsvpDeadline,
    };
  }, [event]);
}

// ---------------------------------------------------------------------------
// CoverPreview
// ---------------------------------------------------------------------------

export function CoverPreview({ event }: { event: UserEvent }) {
  const r = useResolvedEvent(event);
  const cssVars = themeToEventCssVars(r.theme);
  const config = r.coverConfig ?? {};
  const countdown = getCountdown(r.eventDate);

  const bgStyle: React.CSSProperties = {};
  if (config.bgImage || r.coverImage) {
    bgStyle.backgroundImage = `url(${config.bgImage ?? r.coverImage})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (config.bgColor) {
    bgStyle.backgroundColor = config.bgColor;
  }

  const overlayStyle: React.CSSProperties = {};
  if (config.overlayColor) {
    overlayStyle.backgroundColor = config.overlayColor;
    overlayStyle.opacity = config.overlayOpacity ?? 0.3;
  }

  return (
    <EventThemeProvider initialTheme={r.theme}>
      <div className="event-themed relative min-h-[500px] w-full" style={cssVars}>
        <div className="absolute inset-0" style={overlayStyle} />
        <div className="relative z-10 flex min-h-[500px] flex-col items-center justify-center px-6 py-16 text-center">
          {config.logo && (
            <img
              src={config.logo}
              alt="Logo"
              style={{ width: config.logoWidth ?? 120 }}
              className="mb-6"
            />
          )}
          {config.customText && (
            <p
              className="font-script mb-4 text-lg"
              style={{ color: config.textColor ?? "inherit" }}
            >
              {config.customText}
            </p>
          )}
          <h1
            className="font-heading text-4xl md:text-6xl"
            style={{ color: config.textColor ?? "inherit" }}
          >
            {r.name}
          </h1>
          {config.showDate && r.eventDate && (
            <p
              className="font-body mt-4 text-sm uppercase tracking-widest"
              style={{ color: config.textColor ?? "inherit" }}
            >
              {formatDate(r.eventDate)}
              {r.eventTime && ` • ${formatTime12(r.eventTime)}`}
            </p>
          )}
          {config.showCountdown && !countdown.isPast && r.eventDate && (
            <div
              className="font-body mt-6 flex gap-4 text-sm"
              style={{ color: config.textColor ?? "inherit" }}
            >
              <div>
                <span className="text-2xl font-bold">{countdown.days}</span>
                <span className="ml-1 text-xs uppercase">Days</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{countdown.hours}</span>
                <span className="ml-1 text-xs uppercase">Hrs</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{countdown.minutes}</span>
                <span className="ml-1 text-xs uppercase">Min</span>
              </div>
            </div>
          )}
          {config.buttonText && (
            <button
              className="font-body mt-8 rounded-md px-8 py-3 text-sm font-medium uppercase tracking-wider"
              style={{
                backgroundColor: config.buttonColor ?? "var(--event-primary)",
                color: config.textColor === "#ffffff" ? "#ffffff" : "var(--event-bg)",
                borderRadius: "var(--event-button-radius)",
              }}
            >
              {config.buttonText}
            </button>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
}

// ---------------------------------------------------------------------------
// LoginPreview
// ---------------------------------------------------------------------------

export function LoginPreview({ event }: { event: UserEvent }) {
  const r = useResolvedEvent(event);
  const cssVars = themeToEventCssVars(r.theme);
  const config = r.loginConfig ?? {};

  const bgStyle: React.CSSProperties = {};
  if (config.bgImage) {
    bgStyle.backgroundImage = `url(${config.bgImage})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (config.bgColor) {
    bgStyle.backgroundColor = config.bgColor;
  }

  const overlayStyle: React.CSSProperties = {};
  if (config.overlayColor) {
    overlayStyle.backgroundColor = config.overlayColor;
    overlayStyle.opacity = config.overlayOpacity ?? 0.25;
  }

  return (
    <EventThemeProvider initialTheme={r.theme}>
      <div className="event-themed relative min-h-[500px] w-full" style={cssVars}>
        <div className="absolute inset-0" style={bgStyle} />
        <div className="absolute inset-0" style={overlayStyle} />
        <div className="relative z-10 flex min-h-[500px] flex-col items-center justify-center px-6 py-16 text-center">
          {config.logo && (
            <img
              src={config.logo}
              alt="Logo"
              style={{ width: config.logoWidth ?? 120 }}
              className="mb-6"
            />
          )}
          {config.heading && (
            <h2
              className="font-heading text-3xl md:text-4xl"
              style={{ color: config.textColor ?? "inherit" }}
            >
              {config.heading}
            </h2>
          )}
          {config.subheading && (
            <p
              className="font-body mt-2 text-sm"
              style={{ color: config.textColor ?? "inherit" }}
            >
              {config.subheading}
            </p>
          )}
          <div className="mt-6 w-full max-w-xs">
            <div
              className="rounded-md border bg-white/90 px-4 py-3 text-sm text-gray-400"
              style={{ borderColor: "var(--event-border)" }}
            >
              {config.inputPlaceholder ?? "Enter your name"}
            </div>
            <button
              className="font-body mt-4 w-full rounded-md px-6 py-2.5 text-sm font-medium uppercase tracking-wider"
              style={{
                backgroundColor: config.buttonColor ?? "var(--event-primary)",
                color: "#ffffff",
                borderRadius: "var(--event-button-radius)",
              }}
            >
              {config.buttonText ?? "Enter"}
            </button>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}

// ---------------------------------------------------------------------------
// HomePreview
// ---------------------------------------------------------------------------

export function HomePreview({ event }: { event: UserEvent }) {
  const r = useResolvedEvent(event);
  const cssVars = themeToEventCssVars(r.theme);
  const content = r.content ?? {};

  return (
    <EventThemeProvider initialTheme={r.theme}>
      <div className="event-themed min-h-[500px] w-full" style={cssVars}>
        {/* Hero / invitation */}
        <section className="px-6 py-16 text-center">
          {content.rich_title ? (
            <RichTextContent
              html={content.rich_title}
              className="font-heading text-3xl md:text-5xl"
            />
          ) : (
            <h1 className="font-heading text-3xl md:text-5xl">{r.name}</h1>
          )}
          {content.rich_subtitle && (
            <RichTextContent
              html={content.rich_subtitle}
              className="font-script mt-4 text-xl"
            />
          )}
          {r.eventDate && (
            <p className="font-body mt-4 text-sm uppercase tracking-widest text-muted">
              {formatDate(r.eventDate)}
              {r.eventTime && ` • ${formatTime12(r.eventTime)}`}
            </p>
          )}
          {r.venue && (
            <p className="font-body mt-2 text-sm text-muted">{r.venue}</p>
          )}
        </section>

        {/* Story */}
        {(content.story || content.story_image) && (
          <section className="border-current px-6 py-12">
            {content.story_image && (
              <img
                src={content.story_image}
                alt="Story"
                className="mx-auto mb-6 max-h-80 rounded-lg object-cover"
              />
            )}
            {content.story && (
              <p className="font-body mx-auto max-w-2xl text-base leading-relaxed text-current">
                {content.story}
              </p>
            )}
          </section>
        )}

        {/* Invitation body */}
        {content.rich_body && (
          <section className="border-current px-6 py-12">
            <RichTextContent
              html={content.rich_body}
              className="font-body mx-auto max-w-2xl text-base leading-relaxed text-current"
            />
          </section>
        )}

        {/* Invitation card */}
        {(content.invitation_title || content.invitation_body || content.invitation_text) && (
          <section className="border-current px-6 py-12 text-center">
            {content.invitation_title && (
              <h2 className="font-heading text-2xl md:text-3xl">{content.invitation_title}</h2>
            )}
            {content.invitation_subtitle && (
              <p className="font-script mt-2 text-lg text-muted">{content.invitation_subtitle}</p>
            )}
            {content.invitation_body && (
              <RichTextContent
                html={content.invitation_body}
                className="font-body mx-auto mt-4 max-w-2xl text-base leading-relaxed text-current"
              />
            )}
            {content.invitation_text && (
              <p className="font-body mx-auto mt-4 max-w-xl text-sm italic text-muted">
                {content.invitation_text}
              </p>
            )}
          </section>
        )}

        {/* Content sections */}
        {content.sections && content.sections.length > 0 && (
          <section className="border-current px-6 py-12">
            {content.sections
              .filter((s) => s.visible)
              .sort((a, b) => a.order_index - b.order_index)
              .map((section) => (
                <div key={section.id} className="mx-auto mb-8 max-w-2xl">
                  <h3 className="font-heading text-xl">{section.title}</h3>
                  {section.image && (
                    <img
                      src={section.image}
                      alt={section.title}
                      className="my-4 w-full rounded-lg object-cover"
                    />
                  )}
                  <RichTextContent
                    html={section.body}
                    className="font-body mt-2 text-base leading-relaxed text-current"
                  />
                </div>
              ))}
          </section>
        )}

        {/* RSVP button */}
        <section className="px-6 py-12 text-center">
          <button
            className="font-body rounded-md px-8 py-3 text-sm font-medium uppercase tracking-wider"
            style={{
              backgroundColor: "var(--event-primary)",
              color: "var(--event-bg)",
              borderRadius: "var(--event-button-radius)",
            }}
          >
            {content.rsvp_button_text ?? "RSVP Now"}
          </button>
        </section>
      </div>
    </EventThemeProvider>
  );
}

// ---------------------------------------------------------------------------
// RsvpPreview
// ---------------------------------------------------------------------------

export function RsvpPreview({ event }: { event: UserEvent }) {
  const r = useResolvedEvent(event);
  const cssVars = themeToEventCssVars(r.theme);
  const content = r.content ?? {};

  return (
    <EventThemeProvider initialTheme={r.theme}>
      <div className="event-themed min-h-[500px] w-full" style={cssVars}>
        <section className="px-6 py-12">
          <div className="mx-auto max-w-lg rounded-lg border-current bg-surface p-8 shadow-sm" style={{ boxShadow: "var(--event-shadow)" }}>
            <h2 className="font-heading text-center text-2xl">
              {content.rsvp_button_text ? "RSVP" : "RSVP"}
            </h2>
            <p className="font-body mt-2 text-center text-sm text-muted">
              {r.name}
            </p>
            {r.eventDate && (
              <p className="font-body mt-1 text-center text-xs text-muted">
                {formatDate(r.eventDate)}
              </p>
            )}

            {/* Name field */}
            <div className="mt-6">
              <label className="font-body mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                Your Name
              </label>
              <div className="rounded-md border-current bg-current px-3 py-2 text-sm text-current">
                John Doe
              </div>
            </div>

            {/* Attending toggle */}
            <div className="mt-4">
              <label className="font-body mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                Will you attend?
              </label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-md border-current bg-primary px-4 py-2 text-center text-sm text-inverted">
                  Yes, with joy
                </div>
                <div className="flex-1 rounded-md border-current bg-current px-4 py-2 text-center text-sm text-current">
                  Sadly, no
                </div>
              </div>
            </div>

            {/* Plus ones */}
            <div className="mt-4">
              <label className="font-body mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                Number of guests
              </label>
              <div className="rounded-md border-current bg-current px-3 py-2 text-sm text-current">
                1
              </div>
            </div>

            {/* Dietary */}
            <div className="mt-4">
              <label className="font-body mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                Dietary requirements
              </label>
              <div className="rounded-md border-current bg-current px-3 py-2 text-sm text-current">
                None
              </div>
            </div>

            {/* Message */}
            <div className="mt-4">
              <label className="font-body mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                Message to the couple
              </label>
              <div className="min-h-[60px] rounded-md border-current bg-current px-3 py-2 text-sm text-current">
                Can't wait to celebrate with you!
              </div>
            </div>

            <button
              className="font-body mt-6 w-full rounded-md px-6 py-2.5 text-sm font-medium uppercase tracking-wider"
              style={{
                backgroundColor: "var(--event-primary)",
                color: "var(--event-bg)",
                borderRadius: "var(--event-button-radius)",
              }}
            >
              Submit RSVP
            </button>
          </div>
        </section>
      </div>
    </EventThemeProvider>
  );
}

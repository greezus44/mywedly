import { useMemo } from "react";
import type { UserEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import {
  cn,
  formatDate,
  formatTime12,
  getCountdown,
} from "../../lib/utils";

// ===== Cover Preview =====

interface CoverPreviewProps {
  event: Partial<UserEvent>;
  className?: string;
}

export function CoverPreview({ event, className }: CoverPreviewProps) {
  const coverImage = event.cover_image ?? null;
  const coverConfig = (event.cover_config ?? {}) as Record<string, unknown>;

  const overlayOpacity = (coverConfig.overlayOpacity as number) ?? 0.4;
  const titleSize = (coverConfig.titleSize as string) ?? "text-4xl";
  const textAlign = (coverConfig.textAlign as string) ?? "center";

  return (
    <div
      className={cn(
        "relative flex min-h-[400px] items-center justify-center overflow-hidden",
        className
      )}
    >
      {coverImage ? (
        <>
          <img
            src={coverImage}
            alt={event.name ?? "Cover"}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-event-primary to-event-accent" />
      )}
      <div
        className={cn(
          "relative z-10 px-6 py-12 text-center",
          textAlign === "left" && "text-left",
          textAlign === "right" && "text-right"
        )}
      >
        <p className="guest-eyebrow mb-2 text-event-primary-fg opacity-90">
          {event.event_type ?? "Wedding"}
        </p>
        <h1 className={cn("guest-title text-event-primary-fg", titleSize)}>
          {event.name ?? "Our Wedding"}
        </h1>
        {event.event_date && (
          <p className="mt-3 text-lg text-event-primary-fg opacity-90">
            {formatDate(event.event_date)}
          </p>
        )}
        {event.venue && (
          <p className="mt-1 text-sm text-event-primary-fg opacity-75">
            {event.venue}
          </p>
        )}
      </div>
    </div>
  );
}

// ===== Login Preview =====

interface LoginPreviewProps {
  event: Partial<UserEvent>;
  className?: string;
}

export function LoginPreview({ event, className }: LoginPreviewProps) {
  const loginConfig = (event.login_config ?? {}) as Record<string, unknown>;
  const heading = (loginConfig.heading as string) ?? "Welcome";
  const subheading = (loginConfig.subheading as string) ?? "Please enter your name to continue";
  const placeholder = (loginConfig.placeholder as string) ?? "Your full name";
  const buttonText = (loginConfig.buttonText as string) ?? "Enter";

  return (
    <div className={cn("flex min-h-[400px] items-center justify-center guest-section", className)}>
      <div className="event-card event-card-hover w-full max-w-md">
        <h2 className="guest-title text-center">{heading}</h2>
        <p className="guest-subtitle text-center mb-6">{subheading}</p>
        <div className="space-y-3">
          <input
            type="text"
            placeholder={placeholder}
            className="event-input"
            disabled
          />
          <button className="event-btn-primary w-full" disabled>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Home Preview =====

interface HomePreviewProps {
  event: Partial<UserEvent>;
  className?: string;
}

export function HomePreview({ event, className }: HomePreviewProps) {
  const content = (event.content ?? {}) as Record<string, unknown>;
  const introHeading = (content.introHeading as string) ?? "Welcome to our celebration";
  const introBody = (content.introBody as string) ?? "";
  const countdown = getCountdown(event.event_date);

  return (
    <div className={cn("guest-section", className)}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="guest-eyebrow">{event.event_type ?? "Wedding"}</p>
        <h2 className="guest-title">{event.name ?? "Our Wedding"}</h2>
        {event.event_date && (
          <p className="guest-subtitle mb-8">
            {formatDate(event.event_date)}
            {event.event_time && ` at ${formatTime12(event.event_time)}`}
          </p>
        )}

        {!countdown.isPast && (
          <div className="mb-8 flex justify-center gap-4">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((item) => (
              <div
                key={item.label}
                className="event-info-card min-w-[72px] text-center"
              >
                <div className="text-2xl font-bold text-event-primary">
                  {String(item.value).padStart(2, "0")}
                </div>
                <div className="text-xs text-event-muted">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {introHeading && <h3 className="guest-title text-2xl mb-4">{introHeading}</h3>}
        {introBody && (
          <RichTextContent html={introBody} className="text-left" />
        )}

        {event.venue && (
          <div className="mt-8 event-info-card text-left">
            <h4 className="guest-eyebrow mb-1">Venue</h4>
            <p className="text-event-heading font-semibold">{event.venue}</p>
            {event.address && (
              <p className="text-event-muted text-sm">{event.address}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== RSVP Preview =====

interface RsvpPreviewProps {
  event: Partial<UserEvent>;
  className?: string;
}

export function RsvpPreview({ event, className }: RsvpPreviewProps) {
  const content = (event.content ?? {}) as Record<string, unknown>;
  const rsvpHeading = (content.rsvpHeading as string) ?? "RSVP";
  const rsvpSubheading =
    (content.rsvpSubheading as string) ?? "Will you be joining us?";
  const rsvpDeadline = event.rsvp_deadline ?? null;
  const isClosed = useMemo(() => {
    if (!rsvpDeadline) return false;
    return Date.now() > new Date(rsvpDeadline).getTime();
  }, [rsvpDeadline]);

  return (
    <div className={cn("guest-section", className)}>
      <div className="mx-auto max-w-lg">
        <div className="text-center mb-6">
          <h2 className="guest-title">{rsvpHeading}</h2>
          <p className="guest-subtitle">{rsvpSubheading}</p>
        </div>

        {isClosed ? (
          <div className="event-card text-center">
            <p className="text-event-muted">
              RSVP is now closed. If you need to make changes, please contact the
              couple directly.
            </p>
          </div>
        ) : (
          <div className="event-card space-y-4">
            <div>
              <label className="guest-eyebrow block mb-1">Your Name</label>
              <input type="text" className="event-input" disabled placeholder="Your name" />
            </div>

            <div>
              <label className="guest-eyebrow block mb-2">Will you attend?</label>
              <div className="grid grid-cols-2 gap-3">
                <button className="event-btn-primary" disabled>
                  Joyfully Accepts
                </button>
                <button className="event-btn-secondary" disabled>
                  Regretfully Declines
                </button>
              </div>
            </div>

            <div>
              <label className="guest-eyebrow block mb-1">Number of Guests</label>
              <input type="number" className="event-input" disabled defaultValue={1} min={1} />
            </div>

            <div>
              <label className="guest-eyebrow block mb-1">Dietary Requirements</label>
              <textarea className="event-input" disabled rows={2} placeholder="Any allergies or dietary needs" />
            </div>

            <div>
              <label className="guest-eyebrow block mb-1">Message for the Couple</label>
              <textarea className="event-input" disabled rows={3} placeholder="Leave a message..." />
            </div>

            <button className="event-btn-primary w-full" disabled>
              Submit RSVP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

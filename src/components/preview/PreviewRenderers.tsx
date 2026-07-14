import React from "react";
import { resolveTypography } from "../../lib/typography";
import { cn, formatDate, formatTime12, getCountdown } from "../../lib/utils";

// ---- Cover Preview ----
export interface CoverPreviewProps {
  coverImage: string | null;
  coverConfig?: unknown;
  eventName?: unknown; // TypographyStyle | string
  eventType?: unknown;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  className?: string;
}

export const CoverPreview: React.FC<CoverPreviewProps> = ({
  coverImage,
  coverConfig,
  eventName,
  eventType,
  eventDate,
  eventTime,
  venue,
  className,
}) => {
  const name = resolveTypography(eventName, "Our Wedding");
  const type = resolveTypography(eventType, "");
  const cfg = (coverConfig ?? {}) as Record<string, unknown>;
  const overlay = typeof cfg.overlay === "string" ? cfg.overlay : "rgba(0,0,0,0.35)";
  const align = (typeof cfg.align === "string" ? cfg.align : "center") as "left" | "center" | "right";
  const position = typeof cfg.position === "string" ? cfg.position : "center";

  return (
    <div
      className={cn(
        "relative flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-lg",
        className,
      )}
      style={{ textAlign: align }}
    >
      {coverImage ? (
        <img
          src={coverImage}
          alt="Cover"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: position }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-dash-primary/20 to-dash-accent/30" />
      )}
      <div className="absolute inset-0" style={{ backgroundColor: overlay }} />
      <div className="relative z-10 px-6 py-10 text-center" style={{ textAlign: align }}>
        {type.text && (
          <p className="guest-eyebrow mb-2" style={{ ...type.style, color: "var(--event-muted)" }}>
            {type.text}
          </p>
        )}
        <h1 className="guest-title" style={name.style}>
          {name.text}
        </h1>
        {eventDate && (
          <p className="guest-subtitle mt-2" style={{ color: "var(--event-muted)" }}>
            {formatDate(eventDate)}
            {eventTime ? ` at ${formatTime12(eventTime)}` : ""}
          </p>
        )}
        {venue && (
          <p className="guest-subtitle mt-1" style={{ color: "var(--event-muted)" }}>
            {venue}
          </p>
        )}
      </div>
    </div>
  );
};

// ---- Login Preview ----
export interface LoginPreviewProps {
  loginConfig?: unknown;
  eventName?: unknown;
  coverImage?: string | null;
  className?: string;
}

export const LoginPreview: React.FC<LoginPreviewProps> = ({
  loginConfig,
  eventName,
  coverImage,
  className,
}) => {
  const name = resolveTypography(eventName, "Our Wedding");
  const cfg = (loginConfig ?? {}) as Record<string, unknown>;
  const heading = resolveTypography(cfg.heading, "Welcome");
  const subtitle = resolveTypography(cfg.subtitle, "Please sign in to view the invitation");
  const placeholder = typeof cfg.usernamePlaceholder === "string" ? cfg.usernamePlaceholder : "Enter your username";
  const cta = typeof cfg.buttonText === "string" ? cfg.buttonText : "Enter";

  return (
    <div className={cn("guest-section flex flex-col items-center justify-center text-center", className)}>
      {coverImage && (
        <div className="mb-6 h-24 w-24 overflow-hidden rounded-full border-2 border-dash-border">
          <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
        </div>
      )}
      <p className="guest-eyebrow" style={{ ...name.style, color: "var(--event-muted)" }}>
        {name.text}
      </p>
      <h1 className="guest-title" style={heading.style}>
        {heading.text}
      </h1>
      <p className="guest-subtitle mb-6" style={subtitle.style}>
        {subtitle.text}
      </p>
      <div className="w-full max-w-xs space-y-3">
        <input
          type="text"
          placeholder={placeholder}
          className="event-input"
          readOnly
        />
        <button type="button" className="event-btn-primary w-full">
          {cta}
        </button>
      </div>
    </div>
  );
};

// ---- Home Preview ----
export interface HomePreviewProps {
  eventName?: unknown;
  eventType?: unknown;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  address?: string | null;
  coverImage?: string | null;
  welcomeMessage?: unknown; // TypographyStyle | string
  className?: string;
}

export const HomePreview: React.FC<HomePreviewProps> = ({
  eventName,
  eventType,
  eventDate,
  eventTime,
  venue,
  address,
  coverImage,
  welcomeMessage,
  className,
}) => {
  const name = resolveTypography(eventName, "Our Wedding");
  const type = resolveTypography(eventType, "");
  const welcome = resolveTypography(welcomeMessage, "");
  const countdown = getCountdown(eventDate ? `${eventDate}T${eventTime ?? "00:00"}` : null);

  return (
    <div className={cn("guest-section", className)}>
      {coverImage && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <img src={coverImage} alt="Cover" className="h-48 w-full object-cover" />
        </div>
      )}
      <div className="text-center">
        {type.text && <p className="guest-eyebrow" style={{ ...type.style, color: "var(--event-muted)" }}>{type.text}</p>}
        <h1 className="guest-title" style={name.style}>{name.text}</h1>
        {eventDate && (
          <p className="guest-subtitle mt-2" style={{ color: "var(--event-muted)" }}>
            {formatDate(eventDate)}
            {eventTime ? ` at ${formatTime12(eventTime)}` : ""}
          </p>
        )}
      </div>
      {welcome.text && (
        <div className="rich-content mx-auto mt-6 max-w-2xl text-center" style={welcome.style}>
          {welcome.text}
        </div>
      )}
      {!countdown.isPast && eventDate && (
        <div className="mt-8 flex justify-center gap-4">
          {[
            { label: "Days", value: countdown.days },
            { label: "Hours", value: countdown.hours },
            { label: "Minutes", value: countdown.minutes },
            { label: "Seconds", value: countdown.seconds },
          ].map((unit) => (
            <div
              key={unit.label}
              className="event-info-card flex min-w-[64px] flex-col items-center"
            >
              <span className="text-2xl font-bold" style={{ color: "var(--event-primary)" }}>
                {unit.value}
              </span>
              <span className="text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      )}
      {(venue || address) && (
        <div className="event-info-card mx-auto mt-8 max-w-md text-center">
          {venue && <p className="font-semibold" style={{ color: "var(--event-heading)" }}>{venue}</p>}
          {address && <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>{address}</p>}
        </div>
      )}
    </div>
  );
};

// ---- RSVP Preview ----
export interface RsvpPreviewProps {
  eventName?: unknown;
  guestName?: string;
  rsvpDeadline?: string | null;
  className?: string;
}

export const RsvpPreview: React.FC<RsvpPreviewProps> = ({
  eventName,
  guestName,
  rsvpDeadline,
  className,
}) => {
  const name = resolveTypography(eventName, "Our Wedding");
  return (
    <div className={cn("guest-section", className)}>
      <div className="text-center">
        <p className="guest-eyebrow" style={{ color: "var(--event-muted)" }}>RSVP</p>
        <h1 className="guest-title" style={name.style}>{name.text}</h1>
        {guestName && (
          <p className="guest-subtitle mt-2" style={{ color: "var(--event-muted)" }}>
            Hi {guestName}, will you be joining us?
          </p>
        )}
      </div>
      <div className="mx-auto mt-8 max-w-md space-y-4">
        <div className="flex justify-center gap-3">
          <button type="button" className="event-btn-primary">Joyfully Accepts</button>
          <button type="button" className="event-btn-secondary">Regretfully Declines</button>
        </div>
        <div className="event-card">
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-heading)" }}>
            Number of guests
          </label>
          <input type="number" defaultValue={1} min={1} className="event-input" readOnly />
        </div>
        <div className="event-card">
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-heading)" }}>
            Dietary requirements
          </label>
          <textarea placeholder="Any allergies or preferences?" className="event-input min-h-[80px]" readOnly />
        </div>
        <div className="event-card">
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-heading)" }}>
            Message
          </label>
          <textarea placeholder="Leave a message for the couple" className="event-input min-h-[80px]" readOnly />
        </div>
        {rsvpDeadline && (
          <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>
            Please respond by {formatDate(rsvpDeadline)}
          </p>
        )}
        <button type="button" className="event-btn-primary w-full">Submit RSVP</button>
      </div>
    </div>
  );
};

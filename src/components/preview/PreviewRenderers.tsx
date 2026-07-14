import React from "react";
import type { UserEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { cn, formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface CoverConfig {
  headline?: string;
  subtitle?: string;
  overlay?: number;
  layout?: string;
}

interface BasePreviewProps {
  event: UserEvent;
  className?: string;
}

function getCoverConfig(event: UserEvent): CoverConfig {
  const cfg = event.cover_config as Record<string, unknown> | null;
  if (!cfg) return {};
  return {
    headline: (cfg.headline as string) || event.name,
    subtitle: (cfg.subtitle as string) || "",
    overlay: typeof cfg.overlay === "number" ? cfg.overlay : 0.3,
    layout: (cfg.layout as string) || "centered",
  };
}

export function CoverPreview({ event, className }: BasePreviewProps): React.ReactElement {
  const cover = getCoverConfig(event);
  const overlay = cover.overlay ?? 0.3;

  return (
    <div className={cn("relative min-h-[500px] w-full overflow-hidden", className)}>
      {event.cover_image ? (
        <img
          src={event.cover_image}
          alt={event.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-event-surface-alt to-event-bg" />
      )}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(0,0,0,${overlay})` }}
      />
      <div className="relative z-10 flex min-h-[500px] flex-col items-center justify-center px-6 text-center">
        {cover.subtitle && (
          <p className="guest-eyebrow text-white/80">{cover.subtitle}</p>
        )}
        <h1 className="guest-title text-white drop-shadow-lg">
          {cover.headline || event.name}
        </h1>
        {event.event_date && (
          <p className="mt-4 text-lg text-white/90 drop-shadow">
            {formatDate(event.event_date)}
            {event.event_time ? ` • ${formatTime12(event.event_time)}` : ""}
          </p>
        )}
        {event.venue && (
          <p className="mt-2 text-sm text-white/80">{event.venue}</p>
        )}
      </div>
    </div>
  );
}

interface LoginConfig {
  heading?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
}

export function LoginPreview({ event, className }: BasePreviewProps): React.ReactElement {
  const cfg = (event.login_config as Record<string, unknown> | null) ?? {};
  const heading = (cfg.heading as string) || "Enter your name to continue";
  const subtitle = (cfg.subtitle as string) || "Please enter the name on your invitation";
  const placeholder = (cfg.placeholder as string) || "Your full name";
  const buttonText = (cfg.buttonText as string) || "View Invitation";

  return (
    <div className={cn("guest-section flex min-h-[400px] items-center justify-center", className)}>
      <div className="event-card w-full max-w-md text-center">
        <h2 className="guest-title">{heading}</h2>
        <p className="guest-subtitle mt-2">{subtitle}</p>
        <div className="mt-6 space-y-3">
          <input
            type="text"
            placeholder={placeholder}
            className="event-input"
            readOnly
          />
          <button className="event-btn-primary w-full">{buttonText}</button>
        </div>
      </div>
    </div>
  );
}

export function HomePreview({ event, className }: BasePreviewProps): React.ReactElement {
  const content = (event.content as Record<string, unknown> | null) ?? {};
  const introHtml = (content.intro as string) || "";
  const countdown = getCountdown(event.event_date);

  return (
    <div className={cn("", className)}>
      {introHtml && (
        <section className="guest-section text-center">
          <div className="mx-auto max-w-2xl">
            <RichTextContent html={introHtml} />
          </div>
        </section>
      )}
      {!countdown.isPast && event.event_date && (
        <section className="guest-section-tight text-center">
          <p className="guest-eyebrow">Counting down</p>
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold event-font">{countdown.days}</div>
              <div className="text-xs uppercase tracking-wider text-event-muted mt-1">Days</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold event-font">{countdown.hours}</div>
              <div className="text-xs uppercase tracking-wider text-event-muted mt-1">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold event-font">{countdown.minutes}</div>
              <div className="text-xs uppercase tracking-wider text-event-muted mt-1">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold event-font">{countdown.seconds}</div>
              <div className="text-xs uppercase tracking-wider text-event-muted mt-1">Seconds</div>
            </div>
          </div>
        </section>
      )}
      {event.venue && (
        <section className="guest-section-tight">
          <div className="event-info-card max-w-2xl mx-auto text-center">
            <p className="guest-eyebrow">Venue</p>
            <h3 className="guest-title">{event.venue}</h3>
            {event.address && <p className="guest-subtitle mt-2">{event.address}</p>}
          </div>
        </section>
      )}
    </div>
  );
}

interface RsvpConfig {
  heading?: string;
  subtitle?: string;
  submitText?: string;
}

export function RsvpPreview({ event, className }: BasePreviewProps): React.ReactElement {
  const cfg = (event.content as Record<string, unknown> | null) ?? {};
  const rsvp = (cfg.rsvp as Record<string, unknown> | null) ?? {};
  const heading = (rsvp.heading as string) || "RSVP";
  const subtitle = (rsvp.subtitle as string) || "Will you be joining us?";
  const submitText = (rsvp.submitText as string) || "Send RSVP";

  return (
    <div className={cn("guest-section", className)}>
      <div className="event-card max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h2 className="guest-title">{heading}</h2>
          <p className="guest-subtitle mt-2">{subtitle}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-event-muted mb-1.5">Name</label>
            <input type="text" className="event-input" placeholder="Your name" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-event-muted mb-1.5">Will you attend?</label>
            <div className="flex gap-2">
              <button className="event-btn-secondary flex-1">Joyfully Accept</button>
              <button className="event-btn-secondary flex-1">Regretfully Decline</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-event-muted mb-1.5">Number of guests</label>
            <input type="number" className="event-input" defaultValue={1} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-event-muted mb-1.5">Dietary requirements</label>
            <textarea className="event-input" placeholder="Any allergies or dietary needs?" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-event-muted mb-1.5">Message</label>
            <textarea className="event-input" placeholder="Leave a message for the couple" readOnly />
          </div>
          <button className="event-btn-primary w-full">{submitText}</button>
        </div>
      </div>
    </div>
  );
}

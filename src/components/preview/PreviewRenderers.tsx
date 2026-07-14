import React from "react";
import { resolveTypography } from "../../lib/typography";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import type { Json } from "../../lib/supabase";

interface PreviewField {
  text?: string;
  align?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

function field(value: unknown, fallback = ""): { text: string; style: React.CSSProperties } {
  return resolveTypography(value, fallback);
}

interface CoverPreviewProps {
  coverConfig?: Json | null;
  eventName?: string;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  coverImage?: string | null;
}

export function CoverPreview({
  coverConfig,
  eventName,
  eventDate,
  eventTime,
  venue,
  coverImage,
}: CoverPreviewProps) {
  const cfg = (coverConfig ?? {}) as Record<string, unknown>;
  const title = field(cfg.title, eventName ?? "Our Wedding");
  const subtitle = field(cfg.subtitle, "");
  const dateText = field(cfg.date, eventDate ? formatDate(eventDate) : "");
  const timeText = field(cfg.time, eventTime ? formatTime12(eventTime) : "");
  const venueText = field(cfg.venue, venue ?? "");

  return (
    <div
      className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-lg bg-cover bg-center"
      style={coverImage ? { backgroundImage: `url(${coverImage})` } : { background: "var(--event-surface-alt)" }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-12 text-center">
        <h1 className="guest-title" style={title.style}>
          {title.text}
        </h1>
        {subtitle.text && (
          <p className="guest-subtitle" style={subtitle.style}>
            {subtitle.text}
          </p>
        )}
        {(dateText.text || timeText.text) && (
          <div className="flex flex-col items-center gap-1">
            {dateText.text && (
              <p style={dateText.style}>{dateText.text}</p>
            )}
            {timeText.text && (
              <p style={timeText.style}>{timeText.text}</p>
            )}
          </div>
        )}
        {venueText.text && (
          <p style={venueText.style}>{venueText.text}</p>
        )}
      </div>
    </div>
  );
}

interface LoginPreviewProps {
  loginConfig?: Json | null;
  eventName?: string;
}

export function LoginPreview({ loginConfig, eventName }: LoginPreviewProps) {
  const cfg = (loginConfig ?? {}) as Record<string, unknown>;
  const heading = field(cfg.heading, "Welcome");
  const subheading = field(cfg.subheading, `Please sign in to view ${eventName ?? "the event"}.`);
  const inputLabel = field(cfg.inputLabel, "Enter your username");
  const buttonText = field(cfg.buttonText, "Sign In");

  return (
    <div className="guest-section flex flex-col items-center justify-center">
      <div className="event-card w-full max-w-md">
        <h2 className="guest-title mb-2 text-center" style={heading.style}>
          {heading.text}
        </h2>
        <p className="guest-subtitle mb-6 text-center" style={subheading.style}>
          {subheading.text}
        </p>
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium" style={inputLabel.style}>
            {inputLabel.text}
          </label>
          <input
            type="text"
            className="event-input"
            placeholder="Username"
            disabled
          />
          <button type="button" className="event-btn-primary" disabled>
            {buttonText.text}
          </button>
        </div>
      </div>
    </div>
  );
}

interface HomePreviewProps {
  content?: Json | null;
  eventName?: string;
  eventDate?: string | null;
  venue?: string | null;
}

export function HomePreview({
  content,
  eventName,
  eventDate,
  venue,
}: HomePreviewProps) {
  const cfg = (content ?? {}) as Record<string, unknown>;
  const greeting = field(cfg.greeting, "Welcome to our wedding");
  const title = field(cfg.title, eventName ?? "Our Special Day");
  const intro = field(cfg.intro, "");
  const countdown = getCountdown(eventDate);

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl text-center">
        <p className="guest-eyebrow" style={greeting.style}>
          {greeting.text}
        </p>
        <h1 className="guest-title" style={title.style}>
          {title.text}
        </h1>
        {intro.text && (
          <p className="guest-subtitle mx-auto" style={intro.style}>
            {intro.text}
          </p>
        )}
        {eventDate && !countdown.expired && (
          <div className="mt-8 flex justify-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{countdown.days}</div>
              <div className="text-xs uppercase tracking-wider">Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{countdown.hours}</div>
              <div className="text-xs uppercase tracking-wider">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{countdown.minutes}</div>
              <div className="text-xs uppercase tracking-wider">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{countdown.seconds}</div>
              <div className="text-xs uppercase tracking-wider">Seconds</div>
            </div>
          </div>
        )}
        {venue && (
          <p className="mt-6" style={field(cfg.venue).style}>
            {venue}
          </p>
        )}
      </div>
    </div>
  );
}

interface RsvpPreviewProps {
  content?: Json | null;
  eventName?: string;
}

export function RsvpPreview({ content, eventName }: RsvpPreviewProps) {
  const cfg = (content ?? {}) as Record<string, unknown>;
  const heading = field(cfg.heading, "RSVP");
  const subheading = field(cfg.subheading, `Let us know if you can make it to ${eventName ?? "our event"}.`);
  const attendingLabel = field(cfg.attendingLabel, "Will you attend?");
  const plusOnesLabel = field(cfg.plusOnesLabel, "Number of plus ones");
  const dietaryLabel = field(cfg.dietaryLabel, "Dietary requirements");
  const messageLabel = field(cfg.messageLabel, "Message");
  const buttonText = field(cfg.buttonText, "Submit RSVP");

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-xl">
        <h1 className="guest-title mb-2 text-center" style={heading.style}>
          {heading.text}
        </h1>
        <p className="guest-subtitle mb-6 text-center" style={subheading.style}>
          {subheading.text}
        </p>
        <div className="event-card flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={attendingLabel.style}>
              {attendingLabel.text}
            </label>
            <div className="flex gap-2">
              <button type="button" className="event-btn-secondary" disabled>Yes</button>
              <button type="button" className="event-btn-secondary" disabled>No</button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={plusOnesLabel.style}>
              {plusOnesLabel.text}
            </label>
            <input type="number" className="event-input" disabled defaultValue={0} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={dietaryLabel.style}>
              {dietaryLabel.text}
            </label>
            <input type="text" className="event-input" disabled />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={messageLabel.style}>
              {messageLabel.text}
            </label>
            <textarea className="event-input min-h-[80px]" disabled />
          </div>
          <button type="button" className="event-btn-primary mt-2" disabled>
            {buttonText.text}
          </button>
        </div>
      </div>
    </div>
  );
}

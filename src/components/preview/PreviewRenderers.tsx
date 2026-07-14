import React from "react";
import { resolveTypography } from "../../lib/typography";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import type { Json } from "../../lib/supabase";

// ─── Cover Preview ──────────────────────────────────────────────────────────

interface CoverPreviewProps {
  coverImage?: string | null;
  coverConfig?: Json | null;
  name?: string;
  eventType?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
}

export function CoverPreview({
  coverImage,
  coverConfig,
  name,
  eventType,
  eventDate,
  eventTime,
  venue,
}: CoverPreviewProps) {
  const cfg = (coverConfig ?? {}) as Record<string, unknown>;
  const title = resolveTypography(cfg.title, name || "Our Wedding");
  const subtitle = resolveTypography(cfg.subtitle, eventType || "");
  const overlay = (cfg.overlay as number) ?? 0.3;
  const align = (cfg.align as string) || "center";

  return (
    <div
      className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden"
      style={{ textAlign: align as React.CSSProperties["textAlign"] }}
    >
      {coverImage ? (
        <img src={coverImage} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200" />
      )}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlay }}
      />
      <div className="relative z-10 max-w-2xl px-6 py-12">
        <h1 className="guest-title" style={title.style}>
          {title.text}
        </h1>
        {subtitle.text && (
          <p className="guest-subtitle mt-2" style={subtitle.style}>
            {subtitle.text}
          </p>
        )}
        {eventDate && (
          <p className="guest-subtitle mt-4">
            {formatDate(eventDate)}
            {eventTime ? ` • ${formatTime12(eventTime)}` : ""}
          </p>
        )}
        {venue && <p className="guest-subtitle mt-1">{venue}</p>}
      </div>
    </div>
  );
}

// ─── Login Preview ───────────────────────────────────────────────────────────

interface LoginPreviewProps {
  loginConfig?: Json | null;
  eventName?: string;
}

export function LoginPreview({ loginConfig, eventName }: LoginPreviewProps) {
  const cfg = (loginConfig ?? {}) as Record<string, unknown>;
  const heading = resolveTypography(cfg.heading, "Welcome");
  const subheading = resolveTypography(cfg.subheading, `Please sign in to view ${eventName || "the event"}`);
  const placeholder = (cfg.placeholder as string) || "Enter your username";

  return (
    <div className="guest-section flex items-center justify-center">
      <div className="event-card max-w-md w-full">
        <h2 className="guest-title mb-2" style={heading.style}>
          {heading.text}
        </h2>
        <p className="guest-subtitle mb-6" style={subheading.style}>
          {subheading.text}
        </p>
        <input
          type="text"
          className="event-input mb-4"
          placeholder={placeholder}
          readOnly
        />
        <button className="event-btn-primary w-full" type="button">
          Sign In
        </button>
      </div>
    </div>
  );
}

// ─── Home Preview ────────────────────────────────────────────────────────────

interface HomePreviewProps {
  name?: string;
  eventDate?: string | null;
  venue?: string | null;
  content?: Json | null;
}

export function HomePreview({ name, eventDate, venue, content }: HomePreviewProps) {
  const cfg = (content ?? {}) as Record<string, unknown>;
  const heroTitle = resolveTypography(cfg.heroTitle, name || "Our Wedding");
  const heroSubtitle = resolveTypography(cfg.heroSubtitle, "");
  const countdown = getCountdown(eventDate);

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="guest-title" style={heroTitle.style}>
          {heroTitle.text}
        </h1>
        {heroSubtitle.text && (
          <p className="guest-subtitle mt-2" style={heroSubtitle.style}>
            {heroSubtitle.text}
          </p>
        )}
        {eventDate && (
          <p className="guest-subtitle mt-4">{formatDate(eventDate)}</p>
        )}
        {venue && <p className="guest-subtitle mt-1">{venue}</p>}

        {!countdown.isPast && (
          <div className="mt-8 flex justify-center gap-6">
            <CountdownUnit label="Days" value={countdown.days} />
            <CountdownUnit label="Hours" value={countdown.hours} />
            <CountdownUnit label="Minutes" value={countdown.minutes} />
            <CountdownUnit label="Seconds" value={countdown.seconds} />
          </div>
        )}
      </div>
    </div>
  );
}

function CountdownUnit({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>
        {label}
      </span>
    </div>
  );
}

// ─── RSVP Preview ─────────────────────────────────────────────────────────────

interface RsvpPreviewProps {
  rsvpConfig?: Json | null;
  guestName?: string;
}

export function RsvpPreview({ rsvpConfig, guestName }: RsvpPreviewProps) {
  const cfg = (rsvpConfig ?? {}) as Record<string, unknown>;
  const heading = resolveTypography(cfg.heading, "RSVP");
  const subheading = resolveTypography(cfg.subheading, "Will you be attending?");

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="guest-title" style={heading.style}>
          {heading.text}
        </h2>
        <p className="guest-subtitle mt-2" style={subheading.style}>
          {subheading.text}
        </p>
        {guestName && (
          <p className="guest-subtitle mt-4">Welcome, {guestName}</p>
        )}
        <div className="mt-8 flex justify-center gap-4">
          <button className="event-btn-primary" type="button">
            Joyfully Accept
          </button>
          <button className="event-btn-secondary" type="button">
            Regretfully Decline
          </button>
        </div>
      </div>
    </div>
  );
}

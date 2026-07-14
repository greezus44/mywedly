import React from "react";
import { resolveTypography } from "../../lib/typography";
import { formatDate, formatTime12, getCountdown, cn } from "../../lib/utils";
import type { Json } from "../../lib/supabase";

interface EventData {
  name?: string;
  event_type?: string;
  event_date?: string | null;
  event_time?: string | null;
  venue?: string | null;
  address?: string | null;
  cover_image?: string | null;
  cover_config?: Json | null;
  content?: Json | null;
}

function getStr(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "text" in value) {
    const v = (value as { text?: unknown }).text;
    if (typeof v === "string") return v;
  }
  return fallback;
}

function getCoverStyle(config: Json | null | undefined): React.CSSProperties {
  if (!config || typeof config !== "object" || Array.isArray(config)) return {};
  const c = config as Record<string, unknown>;
  const style: React.CSSProperties = {};
  if (typeof c.overlayColor === "string") {
    style.backgroundImage = `linear-gradient(${c.overlayColor}, ${c.overlayColor})`;
  }
  if (typeof c.overlayOpacity === "number") {
    style.opacity = c.overlayOpacity;
  }
  return style;
}

export function CoverPreview({ event }: { event: EventData }) {
  const { text: name, style: nameStyle } = resolveTypography(
    (event.content as Record<string, unknown> | undefined)?.["coverName"],
    event.name || "Our Wedding",
  );
  const { text: dateText, style: dateStyle } = resolveTypography(
    (event.content as Record<string, unknown> | undefined)?.["coverDate"],
    formatDate(event.event_date),
  );
  const { text: venueText, style: venueStyle } = resolveTypography(
    (event.content as Record<string, unknown> | undefined)?.["coverVenue"],
    event.venue || "",
  );

  const countdown = getCountdown(event.event_date ? `${event.event_date}T${event.event_time || "00:00:00"}` : null);

  return (
    <div className="relative w-full min-h-[500px] rounded-lg overflow-hidden bg-dash-bg">
      {event.cover_image && (
        <img
          src={event.cover_image}
          alt="Cover"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div
        className="absolute inset-0"
        style={getCoverStyle(event.cover_config)}
      />
      <div className="relative flex flex-col items-center justify-center min-h-[500px] px-6 text-center py-12">
        <p className="guest-eyebrow">{event.event_type || "We're getting married"}</p>
        <h1 className="guest-title" style={nameStyle}>
          {name}
        </h1>
        {dateText && (
          <p className="guest-subtitle" style={dateStyle}>
            {dateText}
          </p>
        )}
        {venueText && (
          <p className="guest-subtitle mt-1" style={venueStyle}>
            {venueText}
          </p>
        )}
        {!countdown.isPast && (
          <div className="flex gap-6 mt-8">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="text-center">
                <div className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>
                  {countdown[unit]}
                </div>
                <div className="text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>
                  {unit}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LoginPreview({ event }: { event: EventData }) {
  const { text: title, style: titleStyle } = resolveTypography(
    (event.content as Record<string, unknown> | undefined)?.["loginTitle"],
    "Welcome",
  );
  const { text: subtitle, style: subtitleStyle } = resolveTypography(
    (event.content as Record<string, unknown> | undefined)?.["loginSubtitle"],
    "Please sign in with your email to view the invitation",
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6 py-12 text-center">
      <h1 className="guest-title" style={titleStyle}>
        {title}
      </h1>
      <p className="guest-subtitle mb-8" style={subtitleStyle}>
        {subtitle}
      </p>
      <div className="w-full max-w-sm space-y-3">
        <input
          type="email"
          placeholder="Enter your email"
          className="event-input"
          readOnly
        />
        <button type="button" className="event-btn-primary w-full">
          View Invitation
        </button>
      </div>
    </div>
  );
}

export function HomePreview({ event }: { event: EventData }) {
  const { text: welcomeTitle, style: welcomeStyle } = resolveTypography(
    (event.content as Record<string, unknown> | undefined)?.["homeTitle"],
    event.name || "Our Wedding",
  );
  const { text: welcomeBody, style: welcomeBodyStyle } = resolveTypography(
    (event.content as Record<string, unknown> | undefined)?.["homeBody"],
    "We invite you to celebrate our special day with us. Join us as we begin our journey together.",
  );

  return (
    <div className="guest-section">
      <div className="max-w-3xl mx-auto text-center">
        <p className="guest-eyebrow">{event.event_type || "We're getting married"}</p>
        <h1 className="guest-title" style={welcomeStyle}>
          {welcomeTitle}
        </h1>
        <p className="guest-subtitle mt-4" style={welcomeBodyStyle}>
          {welcomeBody}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-4xl mx-auto">
        <div className="event-info-card text-center">
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--event-muted)" }}>
            When
          </div>
          <div className="font-semibold" style={{ color: "var(--event-heading)" }}>
            {formatDate(event.event_date)}
          </div>
          {event.event_time && (
            <div className="text-sm mt-1" style={{ color: "var(--event-muted)" }}>
              {formatTime12(event.event_time)}
            </div>
          )}
        </div>
        <div className="event-info-card text-center">
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--event-muted)" }}>
            Where
          </div>
          <div className="font-semibold" style={{ color: "var(--event-heading)" }}>
            {event.venue || "Venue TBA"}
          </div>
          {event.address && (
            <div className="text-sm mt-1" style={{ color: "var(--event-muted)" }}>
              {event.address}
            </div>
          )}
        </div>
        <div className="event-info-card text-center">
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--event-muted)" }}>
            RSVP
          </div>
          <div className="font-semibold" style={{ color: "var(--event-heading)" }}>
            Respond Soon
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--event-muted)" }}>
            Kindly reply before the deadline
          </div>
        </div>
      </div>
    </div>
  );
}

export function RsvpPreview({ event }: { event: EventData }) {
  const { text: title, style: titleStyle } = resolveTypography(
    (event.content as Record<string, unknown> | undefined)?.["rsvpTitle"],
    "RSVP",
  );
  const { text: subtitle, style: subtitleStyle } = resolveTypography(
    (event.content as Record<string, unknown> | undefined)?.["rsvpSubtitle"],
    "Will you be joining us?",
  );

  return (
    <div className="guest-section">
      <div className="max-w-xl mx-auto text-center">
        <p className="guest-eyebrow">Kindly Reply</p>
        <h1 className="guest-title" style={titleStyle}>
          {title}
        </h1>
        <p className="guest-subtitle mt-2" style={subtitleStyle}>
          {subtitle}
        </p>
      </div>
      <div className="max-w-xl mx-auto mt-8">
        <div className="event-card space-y-4">
          <div className="flex gap-3">
            <button
              type="button"
              className="event-btn-primary flex-1"
            >
              Joyfully Accepts
            </button>
            <button
              type="button"
              className="event-btn-secondary flex-1"
            >
              Regretfully Declines
            </button>
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--event-muted)" }}>
              Number of Guests
            </label>
            <select className="event-input" disabled>
              <option>1 Guest</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--event-muted)" }}>
              Dietary Requirements
            </label>
            <textarea
              className="event-input"
              placeholder="Any dietary needs?"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--event-muted)" }}>
              Message
            </label>
            <textarea
              className="event-input"
              placeholder="Leave a message for the couple"
              readOnly
            />
          </div>
          <button type="button" className="event-btn-primary w-full">
            Submit RSVP
          </button>
        </div>
      </div>
    </div>
  );
}

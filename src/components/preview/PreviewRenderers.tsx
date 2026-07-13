import React from "react";
import type { UserEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown, cn } from "../../lib/utils";

// --- CoverPreview ---

export function CoverPreview({ event }: { event: Partial<UserEvent> }) {
  const cover = event.cover_image;
  const coverConfig = (event.cover_config ?? {}) as Record<string, unknown>;
  const overlayOpacity = (coverConfig.overlayOpacity as number) ?? 0.3;
  const titleColor = (coverConfig.titleColor as string) || "#ffffff";

  return (
    <div
      className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-xl"
      style={{
        backgroundImage: cover ? `url(${cover})` : undefined,
        backgroundColor: cover ? undefined : "var(--event-surface)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {cover && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "#000", opacity: overlayOpacity }}
        />
      )}
      <div className="relative z-10 px-6 text-center" style={{ color: titleColor }}>
        <p className="text-sm uppercase tracking-widest" style={{ opacity: 0.85 }}>
          {event.event_type || "Wedding"}
        </p>
        <h1 className="mt-2 text-4xl font-bold" style={{ fontFamily: "var(--event-font-heading)" }}>
          {event.name || "Our Wedding"}
        </h1>
        <p className="mt-3 text-lg" style={{ opacity: 0.9 }}>
          {formatDate(event.event_date)}
          {event.event_time ? ` at ${formatTime12(event.event_time)}` : ""}
        </p>
        {event.venue && (
          <p className="mt-1 text-base" style={{ opacity: 0.85 }}>
            {event.venue}
          </p>
        )}
      </div>
    </div>
  );
}

// --- LoginPreview ---

export function LoginPreview({ event }: { event: Partial<UserEvent> }) {
  const loginConfig = (event.login_config ?? {}) as Record<string, unknown>;
  const heading = (loginConfig.heading as string) || "Enter your name to continue";
  const subheading = (loginConfig.subheading as string) || "Please enter the name on your invitation";
  const placeholder = (loginConfig.placeholder as string) || "Your full name";
  const cta = (loginConfig.cta as string) || "Continue";

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border border-dash-border bg-dash-surface p-6 shadow-sm">
        <h2 className="text-center text-2xl font-bold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
          {heading}
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>
          {subheading}
        </p>
        <input
          type="text"
          placeholder={placeholder}
          className="event-input mt-4"
          disabled
        />
        <button className="event-btn-primary mt-3 w-full" disabled>
          {cta}
        </button>
      </div>
    </div>
  );
}

// --- HomePreview ---

export function HomePreview({ event }: { event: Partial<UserEvent> }) {
  const content = (event.content ?? {}) as Record<string, unknown>;
  const welcomeTitle = (content.welcomeTitle as string) || "Welcome";
  const welcomeBody = (content.welcomeBody as string) || "We're so glad you're here. Explore the details of our special day below.";
  const countdown = getCountdown(event.event_date);

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold text-center" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
          {welcomeTitle}
        </h2>
        <RichTextContent html={welcomeBody} className="mt-4 text-center" />

        {!countdown.isPast && (
          <div className="mt-8 flex justify-center gap-4">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="event-card text-center" style={{ minWidth: 80 }}>
                <div className="text-2xl font-bold" style={{ color: "var(--event-primary)" }}>
                  {item.value}
                </div>
                <div className="text-xs uppercase" style={{ color: "var(--event-muted)" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="event-card">
            <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
              When & Where
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>
              {formatDate(event.event_date)}
              {event.event_time ? ` at ${formatTime12(event.event_time)}` : ""}
            </p>
            {event.venue && (
              <p className="text-sm" style={{ color: "var(--event-text)" }}>
                {event.venue}
              </p>
            )}
            {event.address && (
              <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                {event.address}
              </p>
            )}
          </div>
          <div className="event-card">
            <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
              Our Story
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>
              Read about how we met and fell in love.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- RsvpPreview ---

export function RsvpPreview({ event }: { event: Partial<UserEvent> }) {
  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-lg">
        <h2 className="text-3xl font-bold text-center" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
          RSVP
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>
          Will you be joining us?
        </p>

        <div className="mt-6 event-card">
          <p className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Name
          </p>
          <input
            type="text"
            placeholder="Your name"
            className="event-input mt-1"
            disabled
          />

          <p className="mt-4 text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Attending
          </p>
          <div className="mt-2 flex gap-3">
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--event-text)" }}>
              <input type="radio" name="rsvp-preview" disabled />
              Joyfully accepts
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--event-text)" }}>
              <input type="radio" name="rsvp-preview" disabled />
              Regretfully declines
            </label>
          </div>

          <p className="mt-4 text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Number of guests
          </p>
          <select className="event-input mt-1" disabled>
            <option>1</option>
            <option>2</option>
            <option>3</option>
          </select>

          <p className="mt-4 text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Dietary requirements
          </p>
          <textarea
            placeholder="Any allergies or dietary needs?"
            className="event-input mt-1"
            rows={2}
            disabled
          />

          <p className="mt-4 text-sm font-medium" style={{ color: "var(--event-text)" }}>
            Message
          </p>
          <textarea
            placeholder="Leave a message for the couple"
            className="event-input mt-1"
            rows={3}
            disabled
          />

          <button className="event-btn-primary mt-4 w-full" disabled>
            Submit RSVP
          </button>
        </div>
      </div>
    </div>
  );
}

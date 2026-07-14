import { useEffect, useState } from "react";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import type { UserEvent, Json } from "../../lib/supabase";

// ─── Cover Preview ───────────────────────────────────────────────────────────

interface CoverPreviewProps {
  event: UserEvent;
}

export function CoverPreview({ event }: CoverPreviewProps) {
  const coverConfig = (event.cover_config ?? {}) as Record<string, unknown>;
  const titleTypo = coverConfig.title as unknown;
  const subtitleTypo = coverConfig.subtitle as unknown;
  const dateTypo = coverConfig.date as unknown;
  const bgImage = coverConfig.backgroundImage as string | undefined;
  const bgColor = coverConfig.backgroundColor as string | undefined;

  const title = resolveTypography(titleTypo, event.draft_title || event.title || "Our Wedding");
  const subtitle = resolveTypography(subtitleTypo, "We invite you to celebrate with us");
  const date = resolveTypography(dateTypo, formatDate(event.draft_event_date || event.event_date));

  return (
    <div
      className="relative flex min-h-[400px] flex-col items-center justify-center px-6 py-16 text-center overflow-hidden"
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundColor: bgColor ?? "var(--event-bg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {bgImage && <div className="absolute inset-0 bg-black/30" />}
      <div className="relative z-10">
        <p className="guest-eyebrow" style={subtitle.style}>
          {subtitle.text}
        </p>
        <h1 className="guest-title" style={title.style}>
          {title.text}
        </h1>
        <p className="guest-subtitle mt-4" style={date.style}>
          {date.text}
        </p>
      </div>
    </div>
  );
}

// ─── Login Preview ────────────────────────────────────────────────────────────

interface LoginPreviewProps {
  event: UserEvent;
}

export function LoginPreview({ event }: LoginPreviewProps) {
  const loginConfig = (event.login_config ?? {}) as Record<string, unknown>;
  const headingTypo = loginConfig.heading as unknown;
  const descriptionTypo = loginConfig.description as unknown;
  const buttonTypo = loginConfig.buttonText as unknown;

  const heading = resolveTypography(headingTypo, "Welcome");
  const description = resolveTypography(descriptionTypo, "Enter your name to find your invitation");
  const buttonText = resolveTypography(buttonTypo, "Find My Invitation");

  return (
    <div className="guest-section-tight flex flex-col items-center justify-center text-center">
      <h2 className="guest-title" style={heading.style}>
        {heading.text}
      </h2>
      <p className="guest-subtitle mt-2" style={description.style}>
        {description.text}
      </p>
      <div className="mt-6 w-full max-w-sm space-y-3">
        <input
          type="text"
          placeholder="Your full name"
          className="event-input"
          disabled
        />
        <button type="button" className="event-btn-primary w-full" style={buttonText.style}>
          {buttonText.text}
        </button>
      </div>
    </div>
  );
}

// ─── Home Preview ─────────────────────────────────────────────────────────────

interface HomePreviewProps {
  event: UserEvent;
}

export function HomePreview({ event }: HomePreviewProps) {
  const content = (event.content ?? {}) as Record<string, unknown>;
  const welcomeTypo = content.welcomeHeading as unknown;
  const welcomeBody = content.welcomeBody as unknown;
  const storyTypo = content.storyHeading as unknown;
  const storyBody = content.storyBody as unknown;

  const welcomeHeading = resolveTypography(welcomeTypo, "Welcome");
  const welcomeText = resolveTypography(welcomeBody, "We can't wait to share our special day with you.");
  const storyHeading = resolveTypography(storyTypo, "Our Story");
  const storyText = resolveTypography(storyBody, "");

  return (
    <div>
      <section className="guest-section text-center">
        <h2 className="guest-title" style={welcomeHeading.style}>
          {welcomeHeading.text}
        </h2>
        <p className="guest-subtitle mx-auto mt-2" style={welcomeText.style}>
          {welcomeText.text}
        </p>
      </section>

      {storyText.text && (
        <section className="guest-section-tight">
          <h2 className="guest-title text-center" style={storyHeading.style}>
            {storyHeading.text}
          </h2>
          <div className="mt-4 max-w-2xl mx-auto">
            <RichTextContent html={typeof storyText.text === "string" ? storyText.text : ""} />
          </div>
        </section>
      )}

      <section className="guest-section-tight text-center">
        <CountdownDisplay date={event.draft_event_date || event.event_date} />
      </section>

      <section className="guest-section-tight">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="event-info-card">
            <h3 className="text-lg font-semibold mb-2">Ceremony</h3>
            <p className="text-sm" style={{ color: "var(--event-muted)" }}>
              {formatDate(event.draft_event_date || event.event_date)}
            </p>
            <p className="text-sm" style={{ color: "var(--event-muted)" }}>
              {formatTime12(event.draft_event_date ? "16:00" : null)}
            </p>
            <p className="text-sm mt-1">{event.draft_venue_name || event.venue_name || "Venue TBD"}</p>
          </div>
          <div className="event-info-card">
            <h3 className="text-lg font-semibold mb-2">Reception</h3>
            <p className="text-sm" style={{ color: "var(--event-muted)" }}>
              {formatDate(event.draft_event_date || event.event_date)}
            </p>
            <p className="text-sm mt-1">{event.draft_venue_address || event.venue_address || "Address TBD"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function CountdownDisplay({ date }: { date: string | null | undefined }) {
  const [countdown, setCountdown] = useState(() => getCountdown(date));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(date));
    }, 1000);
    return () => clearInterval(interval);
  }, [date]);

  if (countdown.isPast) {
    return <p className="guest-subtitle">The event has passed. Thank you for celebrating with us!</p>;
  }

  return (
    <div className="flex justify-center gap-4 md:gap-8">
      {[
        { label: "Days", value: countdown.days },
        { label: "Hours", value: countdown.hours },
        { label: "Minutes", value: countdown.minutes },
        { label: "Seconds", value: countdown.seconds },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-3xl md:text-5xl font-bold" style={{ color: "var(--event-primary)" }}>
            {String(item.value).padStart(2, "0")}
          </div>
          <div className="text-xs uppercase tracking-wider mt-1" style={{ color: "var(--event-muted)" }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RSVP Preview ─────────────────────────────────────────────────────────────

interface RsvpPreviewProps {
  event: UserEvent;
}

export function RsvpPreview({ event }: RsvpPreviewProps) {
  const content = (event.content ?? {}) as Record<string, unknown>;
  const rsvpHeadingTypo = content.rsvpHeading as unknown;
  const rsvpBodyTypo = content.rsvpBody as unknown;

  const heading = resolveTypography(rsvpHeadingTypo, "RSVP");
  const body = resolveTypography(rsvpBodyTypo, "Will you be joining us?");

  return (
    <div className="guest-section text-center">
      <h2 className="guest-title" style={heading.style}>
        {heading.text}
      </h2>
      <p className="guest-subtitle mx-auto mt-2" style={body.style}>
        {body.text}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <button type="button" className="event-btn-primary">
          ✓ Joyfully Accepts
        </button>
        <button type="button" className="event-btn-secondary">
          ✗ Regretfully Declines
        </button>
      </div>
    </div>
  );
}

// Helper to safely resolve Json to string for rendering
export function jsonToString(value: Json | null | undefined, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  return fallback;
}

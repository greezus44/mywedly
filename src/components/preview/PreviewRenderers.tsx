import React from "react";
import type { UserEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

type CoverConfig = {
  heading?: string;
  subheading?: string;
  layout?: "centered" | "split" | "minimal";
};

type LoginConfig = {
  heading?: string;
  body?: string;
  buttonLabel?: string;
  fields?: ("name" | "code")[];
};

type ContentConfig = {
  welcome?: string;
  story?: string;
  schedule?: string;
};

function parseConfig<T>(json: unknown, fallback: T): T {
  if (!json || typeof json !== "object") return fallback;
  return { ...fallback, ...(json as Record<string, unknown>) } as T;
}

export function CoverPreview({ event }: { event: UserEvent }) {
  const cfg = parseConfig<CoverConfig>(event.cover_config, {});
  const heading = cfg.heading || event.name || "Our Wedding";
  const subheading = cfg.subheading || formatDate(event.event_date);
  const layout = cfg.layout || "centered";

  return (
    <div
      className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-lg"
      style={{
        backgroundImage: event.cover_image ? `url(${event.cover_image})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {event.cover_image && <div className="absolute inset-0 bg-black/30" />}
      <div className={`relative z-10 px-6 py-10 text-center ${layout === "split" ? "self-end" : ""}`}>
        <h1 className="text-3xl font-bold text-white drop-shadow sm:text-4xl">{heading}</h1>
        {subheading && <p className="mt-2 text-lg text-white/90 drop-shadow">{subheading}</p>}
        {event.venue && <p className="mt-1 text-sm text-white/80 drop-shadow">{event.venue}</p>}
      </div>
    </div>
  );
}

export function LoginPreview({ event }: { event: UserEvent }) {
  const cfg = parseConfig<LoginConfig>(event.login_config, {});
  const heading = cfg.heading || "Welcome";
  const body = cfg.body || "Please enter your name to continue.";
  const buttonLabel = cfg.buttonLabel || "Enter";
  const fields = cfg.fields || (["name"] as ("name" | "code")[]);

  return (
    <div className="event-card mx-auto max-w-md">
      <h2 className="mb-2 text-2xl font-semibold">{heading}</h2>
      <p className="mb-6 text-sm text-dash-muted">{body}</p>
      <div className="flex flex-col gap-3">
        {fields.includes("name") && (
          <input className="event-input" placeholder="Your name" disabled />
        )}
        {fields.includes("code") && (
          <input className="event-input" placeholder="Access code" disabled />
        )}
        <button className="event-btn-primary mt-2" disabled>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export function HomePreview({ event }: { event: UserEvent }) {
  const cfg = parseConfig<ContentConfig>(event.content, {});
  const countdown = getCountdown(event.event_date);

  return (
    <div className="flex flex-col gap-6">
      <div className="event-card text-center">
        <h2 className="text-2xl font-semibold">{event.name}</h2>
        <p className="mt-1 text-sm text-dash-muted">{formatDate(event.event_date)}</p>
        {event.venue && <p className="mt-1 text-sm">{event.venue}</p>}
      </div>
      {!countdown.isPast && (
        <div className="event-card text-center">
          <p className="text-xs uppercase tracking-wide text-dash-muted">Counting down</p>
          <div className="mt-2 flex justify-center gap-4">
            <div>
              <div className="text-3xl font-bold">{countdown.days}</div>
              <div className="text-xs text-dash-muted">Days</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{countdown.hours}</div>
              <div className="text-xs text-dash-muted">Hours</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{countdown.minutes}</div>
              <div className="text-xs text-dash-muted">Min</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{countdown.seconds}</div>
              <div className="text-xs text-dash-muted">Sec</div>
            </div>
          </div>
        </div>
      )}
      {cfg.welcome && (
        <div className="event-card">
          <RichTextContent html={cfg.welcome} />
        </div>
      )}
    </div>
  );
}

export function RsvpPreview({ event }: { event: UserEvent }) {
  return (
    <div className="event-card mx-auto max-w-lg">
      <h2 className="text-2xl font-semibold">RSVP</h2>
      <p className="mt-1 text-sm text-dash-muted">
        {formatDate(event.event_date)}
        {event.event_time ? ` at ${formatTime12(event.event_time)}` : ""}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <input className="event-input" placeholder="Your name" disabled />
        <div className="flex gap-2">
          <button className="event-btn-primary flex-1" disabled>Yes, I'll attend</button>
          <button className="event-btn-secondary flex-1" disabled>Can't make it</button>
        </div>
      </div>
    </div>
  );
}

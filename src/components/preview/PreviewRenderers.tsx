import { useMemo } from "react";
import type { UserEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { cn, formatDate, formatTime12, getCountdown, to12Hour } from "../../lib/utils";

interface CoverConfig {
  headline?: string;
  subheadline?: string;
  showDate?: boolean;
  showVenue?: boolean;
  showCountdown?: boolean;
  layout?: string;
}

interface LoginConfig {
  heading?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  requireName?: boolean;
  requireCode?: boolean;
}

interface ContentConfig {
  story?: string;
  schedule?: string;
  venue?: string;
  rsvp?: string;
  gallery?: string;
}

function parseConfig<T>(json: unknown, defaults: T): T {
  if (!json || typeof json !== "object") return defaults;
  return { ...defaults, ...(json as object) } as T;
}

const defaultCover: CoverConfig = {
  headline: "",
  subheadline: "",
  showDate: true,
  showVenue: true,
  showCountdown: true,
};

const defaultLogin: LoginConfig = {
  heading: "Enter your invite code",
  subtitle: "Please enter the code from your invitation",
  placeholder: "Enter code",
  buttonText: "Continue",
  requireName: true,
  requireCode: true,
};

const defaultContent: ContentConfig = {
  story: "",
  schedule: "",
  venue: "",
  rsvp: "",
  gallery: "",
};

export function CoverPreview({ event }: { event: Partial<UserEvent> }) {
  const config = parseConfig(event.cover_config, defaultCover);
  const countdown = useMemo(() => getCountdown(event.event_date), [event.event_date]);

  const headline = config.headline || event.name || "Your Event Name";
  const subheadline = config.subheadline || "";

  return (
    <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-amber-50 to-orange-50">
      {event.cover_image && (
        <img
          src={event.cover_image}
          alt="Cover"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 px-6 py-12 text-center text-white">
        {subheadline && (
          <p className="mb-2 text-sm uppercase tracking-widest opacity-90">{subheadline}</p>
        )}
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">{headline}</h1>
        {config.showDate && event.event_date && (
          <p className="mb-1 text-lg opacity-95">{formatDate(event.event_date)}</p>
        )}
        {config.showVenue && event.venue && (
          <p className="mb-4 text-base opacity-90">{event.venue}</p>
        )}
        {config.showCountdown && !countdown.isPast && (
          <div className="mt-6 flex justify-center gap-4">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="flex flex-col items-center">
                <span className="text-2xl font-bold">
                  {countdown[unit].toString().padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-wide opacity-80">{unit}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LoginPreview({ event }: { event: Partial<UserEvent> }) {
  const config = parseConfig(event.login_config, defaultLogin);

  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-dash-bg p-6">
      <div className="w-full max-w-sm rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm">
        <h2 className="mb-2 text-center text-2xl font-bold text-dash-text">
          {config.heading}
        </h2>
        <p className="mb-6 text-center text-sm text-dash-muted">
          {config.subtitle}
        </p>
        <div className="space-y-3">
          {config.requireName && (
            <input
              type="text"
              placeholder="Your name"
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
              readOnly
            />
          )}
          {config.requireCode && (
            <input
              type="text"
              placeholder={config.placeholder}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
              readOnly
            />
          )}
          <button
            type="button"
            className="w-full rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg"
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function HomePreview({ event }: { event: Partial<UserEvent> }) {
  const config = parseConfig(event.content, defaultContent);

  return (
    <div className="rounded-lg bg-dash-surface p-6">
      {event.cover_image && (
        <img
          src={event.cover_image}
          alt="Cover"
          className="mb-6 h-48 w-full rounded-lg object-cover"
        />
      )}
      <h1 className="mb-2 text-3xl font-bold text-dash-text">{event.name || "Event Name"}</h1>
      {event.event_date && (
        <p className="mb-1 text-sm text-dash-muted">
          {formatDate(event.event_date)}
          {event.event_time && ` at ${to12Hour(event.event_time)}`}
        </p>
      )}
      {event.venue && (
        <p className="mb-4 text-sm text-dash-muted">{event.venue}</p>
      )}
      {config.story && (
        <div className="mt-4">
          <h2 className="mb-2 text-xl font-semibold text-dash-text">Our Story</h2>
          <RichTextContent html={config.story} />
        </div>
      )}
    </div>
  );
}

export function RsvpPreview({ event }: { event: Partial<UserEvent> }) {
  return (
    <div className="rounded-lg bg-dash-surface p-6">
      <h2 className="mb-4 text-2xl font-bold text-dash-text">RSVP</h2>
      <p className="mb-4 text-sm text-dash-muted">
        {event.event_date && formatDate(event.event_date)}
        {event.event_time && ` at ${formatTime12(event.event_time)}`}
      </p>
      <div className="space-y-3">
        <div className="flex gap-2">
          <button type="button" className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white">
            ✓ Attending
          </button>
          <button type="button" className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white">
            ✗ Not Attending
          </button>
        </div>
        <input
          type="number"
          placeholder="Number of guests"
          className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
          readOnly
        />
        <textarea
          placeholder="Dietary requirements"
          className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
          readOnly
        />
        <textarea
          placeholder="Leave a message"
          className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
          readOnly
        />
        <button
          type="button"
          className="w-full rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg"
        >
          Submit RSVP
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { cn, formatDate, formatTime12 } from "../../lib/utils";
import { RichTextContent } from "../../lib/sanitize";
import type { UserEvent } from "../../lib/supabase";

// ---------------------------------------------------------------------------
// Shared config helpers
// ---------------------------------------------------------------------------

/** Cover configuration stored in UserEvent.cover_config (Json). */
interface CoverConfig {
  title?: string;
  subtitle?: string;
  dateText?: string;
  overlayOpacity?: number;
  showDate?: boolean;
  showVenue?: boolean;
  textPosition?: "center" | "bottom" | "top";
}

/** Login configuration stored in UserEvent.login_config (Json). */
interface LoginConfig {
  heading?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  requireGuestName?: boolean;
  backgroundImage?: string;
}

/** Content configuration stored in UserEvent.content (Json). */
interface ContentConfig {
  welcomeText?: string;
  storyTitle?: string;
  storyBody?: string;
  rsvpTitle?: string;
  rsvpBody?: string;
  rsvpButtonText?: string;
  scheduleText?: string;
}

function parseConfig<T>(json: unknown, fallback: T): T {
  if (!json || typeof json !== "object") return fallback;
  return { ...fallback, ...(json as Record<string, unknown>) } as T;
}

const DEFAULT_COVER: CoverConfig = {
  title: "Our Wedding",
  subtitle: "",
  overlayOpacity: 0.4,
  showDate: true,
  showVenue: true,
  textPosition: "center",
};

const DEFAULT_LOGIN: LoginConfig = {
  heading: "Welcome",
  subtitle: "Enter your name to view the invitation",
  placeholder: "Your full name",
  buttonText: "View Invitation",
  requireGuestName: true,
};

const DEFAULT_CONTENT: ContentConfig = {
  welcomeText: "We invite you to celebrate our special day with us.",
  storyTitle: "Our Story",
  storyBody: "<p>Share the story of how you met and fell in love.</p>",
  rsvpTitle: "RSVP",
  rsvpBody: "<p>Let us know if you can make it!</p>",
  rsvpButtonText: "Respond Now",
  scheduleText: "Here's what the day looks like.",
};

// ---------------------------------------------------------------------------
// CoverPreview
// ---------------------------------------------------------------------------

export interface CoverPreviewProps {
  event: Pick<
    UserEvent,
    "name" | "event_date" | "event_time" | "venue" | "cover_image" | "cover_config"
  >;
  className?: string;
}

export function CoverPreview({ event, className }: CoverPreviewProps) {
  const config = parseConfig<CoverConfig>(event.cover_config, DEFAULT_COVER);
  const title = config.title || event.name;
  const subtitle = config.subtitle || "";
  const dateText =
    config.dateText ||
    (event.event_date ? formatDate(event.event_date) : "");
  const timeText = event.event_time ? formatTime12(event.event_time) : "";

  const positionClasses: Record<string, string> = {
    center: "items-center justify-center",
    bottom: "items-end justify-center pb-12",
    top: "items-start justify-center pt-12",
  };

  return (
    <div
      className={cn(
        "event-themed relative flex min-h-[420px] w-full overflow-hidden",
        positionClasses[config.textPosition ?? "center"],
        className
      )}
    >
      {/* Background image */}
      {event.cover_image ? (
        <img
          src={event.cover_image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-event-primary/30 to-event-accent/30" />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: config.overlayOpacity ?? 0.4 }}
      />

      {/* Content */}
      <div className="relative z-10 px-6 text-center text-white">
        {subtitle && (
          <p className="guest-eyebrow text-white/80">{subtitle}</p>
        )}
        <h1 className="guest-title text-white drop-shadow-md">
          {title}
        </h1>
        {config.showDate && (dateText || timeText) && (
          <p className="mt-2 text-lg font-medium text-white/90">
            {dateText}
            {dateText && timeText && " · "}
            {timeText}
          </p>
        )}
        {config.showVenue && event.venue && (
          <p className="mt-1 text-sm text-white/80">{event.venue}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoginPreview
// ---------------------------------------------------------------------------

export interface LoginPreviewProps {
  event: Pick<UserEvent, "name" | "login_config">;
  className?: string;
}

export function LoginPreview({ event, className }: LoginPreviewProps) {
  const config = parseConfig<LoginConfig>(event.login_config, DEFAULT_LOGIN);

  return (
    <div
      className={cn(
        "event-themed flex min-h-[420px] w-full items-center justify-center px-6",
        className
      )}
    >
      <div className="event-card event-card-hover w-full max-w-md text-center">
        <p className="guest-eyebrow">{event.name || "Wedding Invitation"}</p>
        <h2 className="guest-title text-2xl">
          {config.heading || "Welcome"}
        </h2>
        <p className="guest-subtitle mt-2">
          {config.subtitle || "Enter your name to view the invitation"}
        </p>

        <div className="mt-6 space-y-3 text-left">
          {config.requireGuestName !== false && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-event-muted">
                {config.placeholder || "Your full name"}
              </label>
              <input
                type="text"
                disabled
                placeholder={config.placeholder || "Your full name"}
                className="event-input"
              />
            </div>
          )}
          <button
            type="button"
            disabled
            className="event-btn-primary w-full"
          >
            {config.buttonText || "View Invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HomePreview
// ---------------------------------------------------------------------------

export interface HomePreviewProps {
  event: Pick<
    UserEvent,
    | "name"
    | "event_date"
    | "event_time"
    | "venue"
    | "address"
    | "content"
  >;
  className?: string;
}

export function HomePreview({ event, className }: HomePreviewProps) {
  const config = parseConfig<ContentConfig>(event.content, DEFAULT_CONTENT);
  const dateText = event.event_date ? formatDate(event.event_date) : "";
  const timeText = event.event_time ? formatTime12(event.event_time) : "";

  return (
    <div className={cn("event-themed w-full", className)}>
      {/* Welcome / Hero */}
      <section className="guest-section text-center">
        <p className="guest-eyebrow">{event.name}</p>
        <h1 className="guest-title">
          {config.welcomeText || "We invite you to celebrate our special day."}
        </h1>
        {(dateText || event.venue) && (
          <div className="mt-4 flex flex-col items-center gap-1 text-event-muted">
            {dateText && (
              <p className="text-base font-medium">
                {dateText}
                {timeText && ` · ${timeText}`}
              </p>
            )}
            {event.venue && <p className="text-sm">{event.venue}</p>}
            {event.address && (
              <p className="text-sm text-event-muted/80">{event.address}</p>
            )}
          </div>
        )}
      </section>

      {/* Story */}
      <section className="guest-section-tight border-t border-event-border">
        <div className="mx-auto max-w-2xl">
          <h2 className="guest-title text-2xl">
            {config.storyTitle || "Our Story"}
          </h2>
          <div className="mt-4">
            <RichTextContent
              html={config.storyBody || "<p>Share your story here.</p>"}
            />
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="guest-section-tight border-t border-event-border">
        <div className="mx-auto max-w-2xl">
          <h2 className="guest-title text-2xl">Schedule</h2>
          <p className="guest-subtitle mt-2">
            {config.scheduleText || "Here's what the day looks like."}
          </p>
          {/* Placeholder schedule items */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Ceremony", time: timeText || "4:00 PM" },
              { label: "Reception", time: "6:00 PM" },
              { label: "Dinner", time: "7:00 PM" },
              { label: "Dancing", time: "9:00 PM" },
            ].map((item) => (
              <div
                key={item.label}
                className="event-info-card flex items-center justify-between"
              >
                <span className="text-sm font-medium text-event-text">
                  {item.label}
                </span>
                <span className="text-sm text-event-muted">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RsvpPreview
// ---------------------------------------------------------------------------

export interface RsvpPreviewProps {
  event: Pick<UserEvent, "name" | "content" | "rsvp_deadline">;
  className?: string;
}

export function RsvpPreview({ event, className }: RsvpPreviewProps) {
  const config = parseConfig<ContentConfig>(event.content, DEFAULT_CONTENT);
  const deadlinePassed = event.rsvp_deadline
    ? new Date(event.rsvp_deadline).getTime() < Date.now()
    : false;

  return (
    <div className={cn("event-themed w-full", className)}>
      <section className="guest-section text-center">
        <p className="guest-eyebrow">{event.name}</p>
        <h1 className="guest-title">
          {config.rsvpTitle || "RSVP"}
        </h1>
        <div className="mx-auto mt-4 max-w-xl">
          <RichTextContent
            html={config.rsvpBody || "<p>Let us know if you can make it!</p>"}
          />
        </div>

        {deadlinePassed ? (
          <div className="mx-auto mt-6 max-w-md rounded-lg border border-event-border bg-event-surface-alt px-4 py-3">
            <p className="text-sm font-medium text-event-muted">
              RSVP for this event has closed.
            </p>
          </div>
        ) : (
          <div className="event-card mx-auto mt-8 max-w-md text-left">
            {/* Status options */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-event-text">
                Will you be attending?
              </p>
              <div className="flex gap-2">
                {["Yes", "No", "Maybe"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled
                    className="event-btn-secondary flex-1"
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Plus ones */}
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-event-text">
                Number of guests
              </label>
              <input
                type="number"
                disabled
                defaultValue={1}
                min={1}
                className="event-input"
              />
            </div>

            {/* Dietary */}
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-event-text">
                Dietary restrictions
              </label>
              <textarea
                disabled
                rows={2}
                placeholder="Any allergies or dietary needs?"
                className="event-input resize-y"
              />
            </div>

            {/* Message */}
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-event-text">
                Message to the couple
              </label>
              <textarea
                disabled
                rows={3}
                placeholder="Leave a note for the happy couple..."
                className="event-input resize-y"
              />
            </div>

            <button
              type="button"
              disabled
              className="event-btn-primary mt-6 w-full"
            >
              {config.rsvpButtonText || "Respond Now"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

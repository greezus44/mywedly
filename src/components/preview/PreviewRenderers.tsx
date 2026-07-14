import React from "react";
import type { UserEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown, to12Hour } from "../../lib/utils";

function getEventField<K extends keyof UserEvent>(
  event: UserEvent,
  draft: boolean,
  field: K
): UserEvent[K] {
  if (draft) {
    const draftField = `draft_${String(field)}` as keyof UserEvent;
    const draftVal = event[draftField];
    return (draftVal !== null && draftVal !== undefined ? draftVal : event[field]) as UserEvent[K];
  }
  return event[field];
}

export function CoverPreview({
  event,
  draft = false,
}: {
  event: UserEvent;
  draft?: boolean;
}) {
  const name = getEventField(event, draft, "name");
  const eventType = getEventField(event, draft, "event_type");
  const eventDate = getEventField(event, draft, "event_date");
  const eventTime = getEventField(event, draft, "event_time");
  const venue = getEventField(event, draft, "venue");
  const address = getEventField(event, draft, "address");
  const coverImage = getEventField(event, draft, "cover_image");

  const countdown = getCountdown(eventDate);

  return (
    <div className="relative min-h-[400px] overflow-hidden rounded-lg">
      {coverImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-event-primary/30 to-event-accent/30" />
      )}
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative flex min-h-[400px] flex-col items-center justify-center p-8 text-center text-white">
        {eventType && (
          <p className="mb-2 text-sm uppercase tracking-widest text-white/80">
            {eventType}
          </p>
        )}
        <h1 className="mb-4 text-4xl font-bold">{name || "Event Name"}</h1>
        {eventDate && (
          <p className="mb-1 text-lg">
            {formatDate(eventDate)}
            {eventTime && ` at ${to12Hour(eventTime)}`}
          </p>
        )}
        {venue && <p className="text-base text-white/90">{venue}</p>}
        {address && <p className="text-sm text-white/70">{address}</p>}
        {!countdown.isPast && eventDate && (
          <div className="mt-6 flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{countdown.days}</div>
              <div className="text-xs uppercase">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{countdown.hours}</div>
              <div className="text-xs uppercase">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{countdown.minutes}</div>
              <div className="text-xs uppercase">Minutes</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LoginPreview({
  event,
  draft = false,
}: {
  event: UserEvent;
  draft?: boolean;
}) {
  const name = getEventField(event, draft, "name");
  const coverImage = getEventField(event, draft, "cover_image");

  return (
    <div className="event-themed flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        {coverImage && (
          <div className="mb-6 h-32 overflow-hidden rounded-lg">
            <img
              src={coverImage}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <h1 className="mb-2 text-center text-2xl font-bold text-event-heading">
          {name || "Event Name"}
        </h1>
        <p className="mb-6 text-center text-sm text-event-muted">
          Enter your name to continue
        </p>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your full name"
            className="event-input"
            disabled
          />
          <button className="event-btn-primary w-full" disabled>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export function HomePreview({
  event,
  draft = false,
}: {
  event: UserEvent;
  draft?: boolean;
}) {
  const name = getEventField(event, draft, "name");
  const eventType = getEventField(event, draft, "event_type");
  const eventDate = getEventField(event, draft, "event_date");
  const eventTime = getEventField(event, draft, "event_time");
  const venue = getEventField(event, draft, "venue");
  const address = getEventField(event, draft, "address");
  const coverImage = getEventField(event, draft, "cover_image");
  const content = getEventField(event, draft, "content");

  return (
    <div className="event-themed min-h-[400px]">
      {coverImage && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={coverImage}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-8">
        <h1 className="mb-2 text-3xl font-bold text-event-heading">
          {name || "Event Name"}
        </h1>
        {eventType && (
          <p className="mb-4 text-sm uppercase tracking-widest text-event-muted">
            {eventType}
          </p>
        )}
        <div className="mb-6 space-y-1">
          {eventDate && (
            <p className="text-event-text">
              {formatDate(eventDate)}
              {eventTime && ` at ${to12Hour(eventTime)}`}
            </p>
          )}
          {venue && <p className="text-event-text">{venue}</p>}
          {address && <p className="text-sm text-event-muted">{address}</p>}
        </div>
        {content && typeof content === "object" && (
          <RichTextContent
            html={(content as { intro?: string }).intro || ""}
          />
        )}
      </div>
    </div>
  );
}

export function RsvpPreview({
  event,
  draft = false,
}: {
  event: UserEvent;
  draft?: boolean;
}) {
  const name = getEventField(event, draft, "name");
  const eventDate = getEventField(event, draft, "event_date");
  const rsvpDeadline = getEventField(event, draft, "rsvp_deadline");

  return (
    <div className="event-themed min-h-[400px] p-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-event-heading">
          RSVP
        </h1>
        <p className="mb-6 text-center text-sm text-event-muted">
          {name || "Event Name"}
          {eventDate && ` · ${formatDate(eventDate)}`}
        </p>
        {rsvpDeadline && (
          <p className="mb-4 text-center text-xs text-event-muted">
            Please respond by {formatDate(rsvpDeadline)}
          </p>
        )}
        <div className="event-card flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-event-text">Name</label>
            <input className="event-input" placeholder="Your name" disabled />
          </div>
          <div>
            <label className="mb-1 block text-sm text-event-text">
              Will you attend?
            </label>
            <div className="flex gap-2">
              <button className="event-btn-primary flex-1" disabled>
                Yes
              </button>
              <button className="event-btn-secondary flex-1" disabled>
                No
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-event-text">
              Dietary requirements
            </label>
            <textarea
              className="event-input min-h-[60px]"
              placeholder="Any allergies or preferences"
              disabled
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-event-text">Message</label>
            <textarea
              className="event-input min-h-[60px]"
              placeholder="Leave a message for the couple"
              disabled
            />
          </div>
          <button className="event-btn-primary w-full" disabled>
            Submit RSVP
          </button>
        </div>
      </div>
    </div>
  );
}

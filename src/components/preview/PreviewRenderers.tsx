import type { UserEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import {
  formatDate,
  formatTime12,
  getCountdown,
  cn,
} from "../../lib/utils";

interface CoverPreviewProps {
  event: Partial<UserEvent>;
  className?: string;
}

export function CoverPreview({ event, className }: CoverPreviewProps) {
  const coverImage =
    (event.draft_cover_image as string | undefined) ??
    event.cover_image ??
    null;
  const name = event.draft_name ?? event.name ?? "Our Wedding";
  const date = event.draft_event_date ?? event.event_date ?? null;
  const venue = event.draft_venue ?? event.venue ?? null;

  const countdown = getCountdown(date ? `${date}T00:00:00` : null);

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-surface-alt text-center",
        className
      )}
    >
      {coverImage && (
        <img
          src={coverImage}
          alt="Cover"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-event-primary">
        <p className="text-sm uppercase tracking-[0.3em] text-event-accent">
          We're getting married
        </p>
        <h1
          className="text-4xl font-bold md:text-5xl"
          style={{ fontFamily: "var(--event-font-heading)" }}
        >
          {name}
        </h1>
        {date && (
          <p className="text-base text-event-text">
            {formatDate(date)}
            {venue ? ` · ${venue}` : ""}
          </p>
        )}
        {!countdown.done && (
          <div className="mt-2 flex gap-4">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="flex flex-col items-center">
                <span className="text-2xl font-bold text-event-primary">
                  {String(countdown[unit]).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase text-event-muted">
                  {unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface LoginPreviewProps {
  event: Partial<UserEvent>;
  className?: string;
}

export function LoginPreview({ event, className }: LoginPreviewProps) {
  const name = event.draft_name ?? event.name ?? "Our Wedding";
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-4 bg-surface p-6",
        className
      )}
    >
      <h2
        className="text-2xl font-bold text-event-heading"
        style={{ fontFamily: "var(--event-font-heading)" }}
      >
        {name}
      </h2>
      <p className="text-sm text-event-muted">Enter your name to continue</p>
      <input
        type="text"
        placeholder="Your name"
        className="h-10 w-full max-w-xs rounded-md border border-event-border bg-event-surface px-3 text-sm text-event-text focus:border-event-primary focus:outline-none"
      />
      <button
        type="button"
        className="h-10 w-full max-w-xs rounded-md bg-event-primary px-4 text-sm font-medium text-event-primary-fg hover:bg-event-primary-hover"
      >
        Enter
      </button>
    </div>
  );
}

interface HomePreviewProps {
  event: Partial<UserEvent>;
  className?: string;
}

export function HomePreview({ event, className }: HomePreviewProps) {
  const name = event.draft_name ?? event.name ?? "Our Wedding";
  const date = event.draft_event_date ?? event.event_date ?? null;
  const time = event.draft_event_time ?? event.event_time ?? null;
  const venue = event.draft_venue ?? event.venue ?? null;
  const address = event.draft_address ?? event.address ?? null;
  const content = (event.draft_content as string | undefined) ??
    (event.content as string | undefined) ??
    "";

  return (
    <div className={cn("flex h-full w-full flex-col gap-6 bg-event-bg p-6", className)}>
      <header className="text-center">
        <h1
          className="text-3xl font-bold text-event-heading"
          style={{ fontFamily: "var(--event-font-heading)" }}
        >
          {name}
        </h1>
        {date && (
          <p className="mt-1 text-sm text-event-muted">{formatDate(date)}</p>
        )}
      </header>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {date && (
          <div className="rounded-lg border border-event-border bg-event-surface p-4">
            <h3 className="text-xs uppercase text-event-muted">Date</h3>
            <p className="mt-1 text-sm text-event-text">{formatDate(date)}</p>
          </div>
        )}
        {time && (
          <div className="rounded-lg border border-event-border bg-event-surface p-4">
            <h3 className="text-xs uppercase text-event-muted">Time</h3>
            <p className="mt-1 text-sm text-event-text">{formatTime12(time)}</p>
          </div>
        )}
        {venue && (
          <div className="rounded-lg border border-event-border bg-event-surface p-4">
            <h3 className="text-xs uppercase text-event-muted">Venue</h3>
            <p className="mt-1 text-sm text-event-text">{venue}</p>
          </div>
        )}
        {address && (
          <div className="rounded-lg border border-event-border bg-event-surface p-4">
            <h3 className="text-xs uppercase text-event-muted">Address</h3>
            <p className="mt-1 text-sm text-event-text">{address}</p>
          </div>
        )}
      </section>
      {content && (
        <section className="prose prose-sm max-w-none text-event-text">
          <RichTextContent
            html={content}
            className="text-event-text"
          />
        </section>
      )}
    </div>
  );
}

interface RsvpPreviewProps {
  event: Partial<UserEvent>;
  className?: string;
}

export function RsvpPreview({ event, className }: RsvpPreviewProps) {
  const name = event.draft_name ?? event.name ?? "Our Wedding";
  const deadline = event.draft_rsvp_deadline ?? event.rsvp_deadline ?? null;
  const closed = deadline ? new Date(deadline).getTime() < Date.now() : false;

  return (
    <div className={cn("flex h-full w-full flex-col gap-4 bg-event-bg p-6", className)}>
      <header className="text-center">
        <h2
          className="text-2xl font-bold text-event-heading"
          style={{ fontFamily: "var(--event-font-heading)" }}
        >
          RSVP
        </h2>
        <p className="mt-1 text-sm text-event-muted">{name}</p>
      </header>
      {closed ? (
        <div className="rounded-lg border border-event-border bg-event-surface p-4 text-center text-sm text-event-muted">
          RSVP is now closed.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {(["Attending", "Decline"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                className="flex-1 rounded-md border border-event-border bg-event-surface px-4 py-2 text-sm text-event-text hover:border-event-primary"
              >
                {opt}
              </button>
            ))}
          </div>
          <label className="text-sm font-medium text-event-foreground">
            Number of guests
          </label>
          <input
            type="number"
            defaultValue={1}
            min={0}
            className="h-10 w-full rounded-md border border-event-border bg-event-surface px-3 text-sm text-event-text focus:border-event-primary focus:outline-none"
          />
          <label className="text-sm font-medium text-event-foreground">
            Dietary requirements
          </label>
          <textarea
            rows={2}
            className="w-full rounded-md border border-event-border bg-event-surface px-3 py-2 text-sm text-event-text focus:border-event-primary focus:outline-none"
          />
          <label className="text-sm font-medium text-event-foreground">
            Message
          </label>
          <textarea
            rows={3}
            className="w-full rounded-md border border-event-border bg-event-surface px-3 py-2 text-sm text-event-text focus:border-event-primary focus:outline-none"
          />
          <button
            type="button"
            className="h-10 rounded-md bg-event-primary px-4 text-sm font-medium text-event-primary-fg hover:bg-event-primary-hover"
          >
            Submit RSVP
          </button>
        </div>
      )}
    </div>
  );
}

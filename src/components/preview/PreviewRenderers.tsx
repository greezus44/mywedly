import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown, cn } from "../../lib/utils";
import type { UserEvent } from "../../lib/supabase";

interface PreviewProps {
  event: Partial<UserEvent>;
}

// ---------------------------------------------------------------------------
// CoverPreview
// ---------------------------------------------------------------------------
export function CoverPreview({ event }: PreviewProps) {
  const cover = event.cover_image || event.draft_cover_image;
  const name = event.draft_name || event.name || "Our Wedding";
  const date = event.draft_event_date || event.event_date;
  const venue = event.draft_venue || event.venue;
  const countdown = getCountdown(date);

  return (
    <div className="event-card relative overflow-hidden">
      {cover ? (
        <div className="relative h-64 w-full">
          <img src={cover} alt={name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
            <h1 className="text-2xl font-bold text-white drop-shadow">{name}</h1>
            {date && <p className="mt-1 text-sm text-white/90">{formatDate(date)}</p>}
            {venue && <p className="text-xs text-white/80">{venue}</p>}
          </div>
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <h1 className="text-2xl font-bold">{name}</h1>
          {date && <p className="text-sm">{formatDate(date)}</p>}
          {venue && <p className="text-xs text-dash-muted">{venue}</p>}
        </div>
      )}
      {!countdown.isPast && date && (
        <div className="mt-4 flex justify-center gap-4 text-center">
          {[
            { label: "Days", value: countdown.days },
            { label: "Hours", value: countdown.hours },
            { label: "Mins", value: countdown.minutes },
            { label: "Secs", value: countdown.seconds },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-xs uppercase tracking-wide text-dash-muted">{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoginPreview
// ---------------------------------------------------------------------------
export function LoginPreview({ event }: PreviewProps) {
  const name = event.draft_name || event.name || "Our Wedding";
  return (
    <div className="event-card mx-auto max-w-sm">
      <h2 className="mb-4 text-center text-xl font-semibold">Welcome to {name}</h2>
      <p className="mb-4 text-center text-sm text-dash-muted">
        Please enter your name to find your invitation.
      </p>
      <input
        type="text"
        placeholder="Your full name"
        className="event-input mb-3"
        readOnly
      />
      <button type="button" className="event-btn-primary w-full">
        Find My Invitation
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HomePreview
// ---------------------------------------------------------------------------
export function HomePreview({ event }: PreviewProps) {
  const name = event.draft_name || event.name || "Our Wedding";
  const date = event.draft_event_date || event.event_date;
  const time = event.draft_event_time || event.event_time;
  const venue = event.draft_venue || event.venue;
  const address = event.draft_address || event.address;
  const content = event.draft_content || event.content;

  let welcomeHtml = "";
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const c = content as Record<string, unknown>;
    welcomeHtml = (c.welcome as string) || (c.home as string) || "";
  }

  return (
    <div className="space-y-6">
      <div className="event-card text-center">
        <h1 className="text-3xl font-bold">{name}</h1>
        {date && <p className="mt-2 text-lg">{formatDate(date)}</p>}
        {time && <p className="text-sm text-dash-muted">{formatTime12(time)}</p>}
        {venue && <p className="mt-2 font-medium">{venue}</p>}
        {address && <p className="text-sm text-dash-muted">{address}</p>}
      </div>
      {welcomeHtml && (
        <div className="event-card">
          <RichTextContent html={welcomeHtml} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RsvpPreview
// ---------------------------------------------------------------------------
export function RsvpPreview({ event }: PreviewProps) {
  const name = event.draft_name || event.name || "Our Wedding";
  const deadline = event.draft_rsvp_deadline || event.rsvp_deadline;
  const closed = deadline ? new Date(deadline).getTime() < Date.now() : false;

  return (
    <div className="event-card mx-auto max-w-md">
      <h2 className="mb-2 text-center text-xl font-semibold">RSVP</h2>
      <p className="mb-4 text-center text-sm text-dash-muted">
        {name}
      </p>
      {closed ? (
        <p className={cn("text-center text-sm text-dash-muted")}>
          RSVP is now closed.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button type="button" className="event-btn-primary flex-1">
              Joyfully Accepts
            </button>
            <button type="button" className="event-btn-secondary flex-1">
              Regretfully Declines
            </button>
          </div>
          <label className="text-sm font-medium">Number of guests</label>
          <select className="event-input" disabled defaultValue="1">
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
          <label className="text-sm font-medium">Dietary requirements</label>
          <textarea
            className="event-input min-h-[60px]"
            placeholder="Any allergies or dietary needs?"
            readOnly
          />
          <label className="text-sm font-medium">Message for the couple</label>
          <textarea
            className="event-input min-h-[60px]"
            placeholder="Leave a message…"
            readOnly
          />
          <button type="button" className="event-btn-primary w-full">
            Submit RSVP
          </button>
        </div>
      )}
    </div>
  );
}

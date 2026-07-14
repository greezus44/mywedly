import { resolveTypography } from "../../lib/typography";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import type { UserEvent } from "../../lib/supabase";

interface CoverPreviewProps {
  event: Partial<UserEvent>;
}

export function CoverPreview({ event }: CoverPreviewProps) {
  const nameTy = resolveTypography((event as Record<string, unknown>).cover_name, event.name ?? "");
  const eventTypeTy = resolveTypography((event as Record<string, unknown>).cover_event_type, event.event_type ?? "");
  const dateTy = resolveTypography((event as Record<string, unknown>).cover_date, event.event_date ?? "");
  const venueTy = resolveTypography((event as Record<string, unknown>).cover_venue, event.venue ?? "");
  const coverImage = event.cover_image;
  const coverConfig = (event as Record<string, unknown>).cover_config as { overlay?: number; layout?: string } | undefined;
  const overlay = coverConfig?.overlay ?? 0.3;

  return (
    <div className="relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-lg">
      {coverImage ? (
        <img src={coverImage} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200" />
      )}
      <div className="absolute inset-0 bg-black" style={{ opacity: overlay }} />
      <div className="relative z-10 px-6 py-12 text-center">
        <div className="guest-eyebrow" style={eventTypeTy.style}>
          {eventTypeTy.text}
        </div>
        <h1 className="guest-title text-white" style={nameTy.style}>
          {nameTy.text}
        </h1>
        {dateTy.text && (
          <p className="guest-subtitle text-white/90" style={dateTy.style}>
            {formatDate(dateTy.text)}
            {event.event_time && ` · ${formatTime12(event.event_time)}`}
          </p>
        )}
        {venueTy.text && (
          <p className="guest-subtitle text-white/80" style={venueTy.style}>
            {venueTy.text}
          </p>
        )}
      </div>
    </div>
  );
}

interface LoginPreviewProps {
  event: Partial<UserEvent>;
}

export function LoginPreview({ event }: LoginPreviewProps) {
  const titleTy = resolveTypography((event as Record<string, unknown>).login_title, event.name ?? "");
  const subtitleTy = resolveTypography((event as Record<string, unknown>).login_subtitle, "Enter your username to access your invitation");

  return (
    <div className="guest-section-tight flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h2 className="guest-title" style={titleTy.style}>{titleTy.text}</h2>
          <p className="guest-subtitle" style={subtitleTy.style}>{subtitleTy.text}</p>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Your username"
            className="event-input"
            readOnly
          />
          <button type="button" className="event-btn-primary w-full">View My Invitation</button>
        </div>
      </div>
    </div>
  );
}

interface HomePreviewProps {
  event: Partial<UserEvent>;
}

export function HomePreview({ event }: HomePreviewProps) {
  const nameTy = resolveTypography((event as Record<string, unknown>).home_title, event.name ?? "");
  const welcomeTy = resolveTypography((event as Record<string, unknown>).home_welcome, "Welcome to our wedding");
  const countdown = getCountdown(event.event_date);

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl text-center">
        <div className="guest-eyebrow" style={welcomeTy.style}>{welcomeTy.text}</div>
        <h1 className="guest-title" style={nameTy.style}>{nameTy.text}</h1>
        {event.event_date && (
          <p className="guest-subtitle">
            {formatDate(event.event_date)}
            {event.event_time && ` · ${formatTime12(event.event_time)}`}
          </p>
        )}
        {event.venue && <p className="guest-subtitle">{event.venue}</p>}
        {!countdown.isPast && (
          <div className="mt-8 flex justify-center gap-4">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="event-info-card min-w-[64px]">
                <div className="text-2xl font-bold" style={{ color: "var(--event-primary)" }}>{item.value}</div>
                <div className="text-xs uppercase text-[color:var(--event-muted)]">{item.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RsvpPreviewProps {
  event: Partial<UserEvent>;
}

export function RsvpPreview({ event }: RsvpPreviewProps) {
  const titleTy = resolveTypography((event as Record<string, unknown>).rsvp_title, "RSVP");
  const subtitleTy = resolveTypography((event as Record<string, unknown>).rsvp_subtitle, "Please let us know if you can make it");

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h2 className="guest-title" style={titleTy.style}>{titleTy.text}</h2>
          <p className="guest-subtitle" style={subtitleTy.style}>{subtitleTy.text}</p>
        </div>
        <div className="event-card space-y-4">
          <div className="flex gap-3">
            <button type="button" className="event-btn-primary flex-1">Joyfully Accepts</button>
            <button type="button" className="event-btn-secondary flex-1">Regretfully Declines</button>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-muted)" }}>Number of guests</label>
            <select className="event-input" disabled>
              <option>1</option>
              <option>2</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-muted)" }}>Dietary requirements</label>
            <textarea className="event-input" placeholder="Any allergies or dietary needs..." readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-muted)" }}>Message for the couple</label>
            <textarea className="event-input" placeholder="Leave a note..." readOnly />
          </div>
          <button type="button" className="event-btn-primary w-full">Submit RSVP</button>
        </div>
      </div>
    </div>
  );
}

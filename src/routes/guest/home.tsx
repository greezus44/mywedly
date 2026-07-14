import { Link } from "react-router-dom";
import { useGuestOutletContext } from "./guest-layout";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12 } from "../../lib/utils";

interface HomeContent {
  introHtml?: string;
  storyHtml?: string;
  detailsHtml?: string;
}

export default function GuestHome() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const content = (event.content ?? {}) as HomeContent;

  const base = `/e/${slug}`;
  const showRsvp = invitedSubEventIds.length > 0;

  return (
    <div className="animate-fadeIn">
      {/* Hero / cover image */}
      {event.cover_image && (
        <div className="relative h-64 w-full overflow-hidden sm:h-80 md:h-96">
          <img src={event.cover_image} alt={event.name} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Welcome section */}
      <section className="guest-section text-center">
        <p className="guest-eyebrow mb-2">Welcome</p>
        <h1 className="guest-title">{event.name}</h1>
        {event.event_date && (
          <p className="guest-subtitle mx-auto mb-2">
            {formatDate(event.event_date)}
            {event.event_time ? ` at ${formatTime12(event.event_time)}` : ""}
          </p>
        )}
        {event.venue && (
          <p className="guest-subtitle mx-auto">{event.venue}</p>
        )}
        {content.introHtml && (
          <div className="rich-content mx-auto mt-6 max-w-2xl text-left">
            <RichTextContent html={content.introHtml} />
          </div>
        )}
        {showRsvp && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={`${base}/rsvp`} className="event-btn-primary">RSVP Now</Link>
            <Link to={`${base}/contact`} className="event-btn-secondary">Contact</Link>
          </div>
        )}
      </section>

      {/* Story section */}
      {content.storyHtml && (
        <section className="guest-section-tight" style={{ backgroundColor: "var(--event-surface)" }}>
          <div className="mx-auto max-w-2xl">
            <p className="guest-eyebrow text-center mb-4">Our Story</p>
            <RichTextContent html={content.storyHtml} />
          </div>
        </section>
      )}

      {/* Details section */}
      {content.detailsHtml && (
        <section className="guest-section-tight">
          <div className="mx-auto max-w-2xl">
            <p className="guest-eyebrow text-center mb-4">Details</p>
            <RichTextContent html={content.detailsHtml} />
          </div>
        </section>
      )}

      {/* Event info cards */}
      <section className="guest-section-tight">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {event.event_date && (
            <div className="event-info-card text-center">
              <p className="guest-eyebrow mb-2">Date</p>
              <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                {formatDate(event.event_date)}
              </p>
              {event.event_time && (
                <p style={{ color: "var(--event-muted)" }}>{formatTime12(event.event_time)}</p>
              )}
            </div>
          )}
          {event.venue && (
            <div className="event-info-card text-center">
              <p className="guest-eyebrow mb-2">Venue</p>
              <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                {event.venue}
              </p>
              {event.address && (
                <p style={{ color: "var(--event-muted)" }}>{event.address}</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

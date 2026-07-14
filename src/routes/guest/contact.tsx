import { useOutletContext } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime12 } from "../../lib/utils";

export default function GuestContactPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const mapLink = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${event.venue ?? ""} ${event.address}`.trim()
      )}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold text-event-heading">Contact</h1>

      <div className="event-card space-y-4">
        <div>
          <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-event-muted">
            Event
          </h2>
          <p className="text-lg font-semibold text-event-heading">{event.name}</p>
          {event.event_date && (
            <p className="text-event-text">{formatDate(event.event_date)}</p>
          )}
          {event.event_time && (
            <p className="text-event-text">{formatTime12(event.event_time)}</p>
          )}
        </div>

        {event.venue && (
          <div>
            <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-event-muted">
              Venue
            </h2>
            <p className="text-event-text">{event.venue}</p>
          </div>
        )}

        {event.address && (
          <div>
            <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-event-muted">
              Address
            </h2>
            <p className="text-event-text whitespace-pre-wrap">{event.address}</p>
          </div>
        )}

        {mapLink && (
          <div>
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="event-btn-secondary inline-block"
            >
              📍 View on map
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

import { useOutletContext } from "react-router-dom";
import { type UserEvent } from "../../lib/supabase";

export default function GuestContact() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const hasVenue = !!event.venue;
  const hasAddress = !!event.address;
  const mapQuery = [event.venue, event.address].filter(Boolean).join(", ");
  const mapLink = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Contact & Venue</h1>
      </div>

      <div className="event-card space-y-4">
        {hasVenue ? (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">Venue</h2>
            <p className="mt-1 text-lg">{event.venue}</p>
          </div>
        ) : null}

        {hasAddress ? (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">Address</h2>
            <p className="mt-1 whitespace-pre-line">{event.address}</p>
          </div>
        ) : null}

        {event.event_date && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">Date</h2>
            <p className="mt-1">
              {new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {mapLink && (
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="event-btn-primary inline-block"
          >
            View on Map
          </a>
        )}
      </div>

      {!hasVenue && !hasAddress && (
        <div className="event-card text-center">
          <p className="opacity-70">Contact and venue details have not been provided yet.</p>
        </div>
      )}
    </div>
  );
}

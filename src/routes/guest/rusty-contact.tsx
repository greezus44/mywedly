import { useOutletContext } from "react-router-dom";
import { type UserEvent } from "../../lib/supabase";

export default function RustyContact() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const mapsLink = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${event.address}`)}`
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="font-event text-2xl text-event-heading">Contact</h2>
        <p className="mt-1 text-event-muted">Venue and contact details.</p>
      </div>

      <div className="event-card border-2 border-event-border space-y-4">
        {event.venue && (
          <div>
            <h3 className="text-sm font-semibold text-event-muted uppercase tracking-wide">Venue</h3>
            <p className="mt-1 text-event-text">{event.venue}</p>
          </div>
        )}

        {event.address && (
          <div>
            <h3 className="text-sm font-semibold text-event-muted uppercase tracking-wide">Address</h3>
            <p className="mt-1 text-event-text whitespace-pre-wrap">{event.address}</p>
          </div>
        )}

        {mapsLink && (
          <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-event-primary hover:underline">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            View on Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

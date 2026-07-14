import { useGuestOutletContext } from "./guest-layout";
import { formatDate, formatTime12 } from "../../lib/utils";

export default function GuestContact() {
  const { event } = useGuestOutletContext();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Contact</h1>

      <div className="event-card space-y-3">
        {event.venue && (
          <div>
            <p className="text-sm font-medium opacity-70">Venue</p>
            <p className="text-lg">{event.venue}</p>
          </div>
        )}
        {event.address && (
          <div>
            <p className="text-sm font-medium opacity-70">Address</p>
            <p className="text-lg">{event.address}</p>
          </div>
        )}
        {event.event_date && (
          <div>
            <p className="text-sm font-medium opacity-70">Date</p>
            <p className="text-lg">{formatDate(event.event_date)}</p>
          </div>
        )}
        {event.event_time && (
          <div>
            <p className="text-sm font-medium opacity-70">Time</p>
            <p className="text-lg">{formatTime12(event.event_time)}</p>
          </div>
        )}
        {event.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="event-btn-secondary inline-block"
          >
            Open in Google Maps
          </a>
        )}
      </div>

      {event.address && (
        <div className="overflow-hidden rounded-lg border border-event-border">
          <iframe
            title="Map"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed`}
            className="h-64 w-full"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

import { useGuestOutletContext } from "./guest-layout";
import { formatDate, formatTime12 } from "../../lib/utils";

export default function GuestContact() {
  const { event } = useGuestOutletContext();

  return (
    <div>
      <section className="guest-section-tight text-center">
        <p className="guest-eyebrow">Contact</p>
        <h1 className="guest-title">Find Your Way</h1>
        <p className="guest-subtitle mx-auto">Venue details and directions for the celebration.</p>
      </section>

      <section className="guest-section-tight">
        <div className="event-card mx-auto max-w-lg space-y-5">
          {event.venue && (
            <div>
              <p className="guest-eyebrow">Venue</p>
              <p className="text-lg font-medium">{event.venue}</p>
            </div>
          )}
          {event.address && (
            <div>
              <p className="guest-eyebrow">Address</p>
              <p className="text-base leading-relaxed">{event.address}</p>
            </div>
          )}
          {event.event_date && (
            <div>
              <p className="guest-eyebrow">Date</p>
              <p className="text-base">{formatDate(event.event_date)}</p>
            </div>
          )}
          {event.event_time && (
            <div>
              <p className="guest-eyebrow">Time</p>
              <p className="text-base">{formatTime12(event.event_time)}</p>
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
          <div className="mx-auto mt-6 max-w-lg overflow-hidden rounded-2xl border" style={{ borderColor: "var(--event-border)" }}>
            <iframe
              title="Map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed`}
              className="h-72 w-full"
              loading="lazy"
            />
          </div>
        )}
      </section>
    </div>
  );
}

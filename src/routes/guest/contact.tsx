import { useGuestOutletContext } from "./guest-layout";

export default function GuestContact() {
  const { event } = useGuestOutletContext();
  const mapQuery = [event.venue, event.address].filter(Boolean).join(", ");
  const mapSrc = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : null;

  return (
    <div className="guest-section animate-fadeIn">
      <div className="mx-auto max-w-2xl">
        <h1 className="guest-title text-center">Contact</h1>
        <p className="guest-subtitle text-center mb-8">Get in touch or find your way.</p>

        <div className="space-y-6">
          {/* Venue section */}
          {event.venue && (
            <section className="event-info-card">
              <p className="guest-eyebrow mb-2">Venue</p>
              <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                {event.venue}
              </p>
              {event.address && (
                <p style={{ color: "var(--event-muted)" }}>{event.address}</p>
              )}
            </section>
          )}

          {/* Date & time section */}
          {event.event_date && (
            <section className="event-info-card">
              <p className="guest-eyebrow mb-2">Date &amp; Time</p>
              <p className="font-semibold" style={{ color: "var(--event-heading)" }}>
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {event.event_time && (
                <p style={{ color: "var(--event-muted)" }}>
                  {(() => {
                    const [h, m] = event.event_time.split(":");
                    const hh = parseInt(h, 10);
                    const period = hh >= 12 ? "PM" : "AM";
                    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
                    return `${hour12}:${m ?? "00"} ${period}`;
                  })()}
                </p>
              )}
            </section>
          )}

          {/* Map section */}
          {mapSrc && (
            <section>
              <p className="guest-eyebrow mb-3">Location</p>
              <div className="overflow-hidden rounded-xl">
                <iframe
                  title="Map"
                  src={mapSrc}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            </section>
          )}

          {/* Directions link */}
          {mapQuery && (
            <div className="text-center">
              <a
                href={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="event-btn-secondary"
              >
                Open in Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

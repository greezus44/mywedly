import { useGuestOutletContext } from "./guest-layout";
import { formatDate, formatTime12 } from "../../lib/utils";

export default function GuestContact() {
  const { event } = useGuestOutletContext();

  const venue = event.venue || null;
  const address = event.address || null;
  const eventDate = event.event_date || null;
  const eventTime = event.event_time || null;
  const mapQuery = [address, venue].filter(Boolean).join(", ");
  const mapSrc = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : null;

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <p className="guest-eyebrow">Get In Touch</p>
          <h1 className="guest-title">Contact & Venue</h1>
          <p className="guest-subtitle mx-auto">Details for the big day.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* When */}
          <div
            className="event-card"
            style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text)" }}
          >
            <p className="guest-eyebrow mb-2">When</p>
            {eventDate ? (
              <>
                <p className="text-lg font-semibold mb-1" style={{ color: "var(--event-heading)" }}>
                  {formatDate(eventDate)}
                </p>
                {eventTime && (
                  <p style={{ color: "var(--event-muted)" }}>{formatTime12(eventTime)}</p>
                )}
              </>
            ) : (
              <p style={{ color: "var(--event-muted)" }}>Date to be announced.</p>
            )}
          </div>

          {/* Where */}
          <div
            className="event-card"
            style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text)" }}
          >
            <p className="guest-eyebrow mb-2">Where</p>
            {venue ? (
              <p className="text-lg font-semibold mb-1" style={{ color: "var(--event-heading)" }}>
                {venue}
              </p>
            ) : (
              <p className="text-lg font-semibold mb-1" style={{ color: "var(--event-heading)" }}>
                Venue to be announced
              </p>
            )}
            {address && (
              <p style={{ color: "var(--event-muted)" }}>{address}</p>
            )}
          </div>
        </div>

        {/* Embedded map */}
        {mapSrc && (
          <div className="mt-6 overflow-hidden rounded-lg border" style={{ borderColor: "var(--event-border)" }}>
            <iframe
              title="Venue Map"
              src={mapSrc}
              width="100%"
              height="360"
              style={{ border: 0, display: "block" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </section>
  );
}

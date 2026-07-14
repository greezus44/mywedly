import { useGuestOutletContext } from "./guest-layout";
import { formatDate, formatTime12 } from "../../lib/utils";

export default function GuestContact() {
  const { event } = useGuestOutletContext();

  const mapSrc = event.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed`
    : null;

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="guest-eyebrow">Get In Touch</p>
          <h1 className="guest-title">Contact & Venue</h1>
          <p className="guest-subtitle mx-auto">Details for {event.name}.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Date & Time */}
          <div
            className="rounded-md p-6"
            style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text)", border: "1px solid var(--event-border)" }}
          >
            <p className="guest-eyebrow mb-2">When</p>
            <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
              {formatDate(event.event_date) || "Date to be announced"}
            </p>
            {event.event_time && (
              <p className="text-sm" style={{ color: "var(--event-muted)" }}>{formatTime12(event.event_time)}</p>
            )}
          </div>

          {/* Venue */}
          <div
            className="rounded-md p-6"
            style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text)", border: "1px solid var(--event-border)" }}
          >
            <p className="guest-eyebrow mb-2">Where</p>
            <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
              {event.venue || "Venue to be announced"}
            </p>
            {event.address && (
              <p className="text-sm" style={{ color: "var(--event-muted)" }}>{event.address}</p>
            )}
          </div>
        </div>

        {/* Embedded map */}
        {mapSrc && (
          <div className="mt-6 overflow-hidden rounded-md" style={{ border: "1px solid var(--event-border)" }}>
            <iframe
              title="Venue map"
              src={mapSrc}
              style={{ width: "100%", height: "320px", border: "none" }}
              loading="lazy"
            />
          </div>
        )}

        {/* Contact card */}
        <div
          className="mt-6 rounded-md p-6 text-center"
          style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text)", border: "1px solid var(--event-border)" }}
        >
          <p className="guest-eyebrow mb-2">Questions?</p>
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>
            If you have any questions about the event, please reach out to your hosts.
          </p>
        </div>
      </div>
    </section>
  );
}

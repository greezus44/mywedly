import { useGuestOutletContext } from "./guest-layout";
import { formatDate, to12Hour } from "../../lib/utils";

export default function GuestContact() {
  const { event } = useGuestOutletContext();

  const mapQuery = encodeURIComponent([event.venue, event.address].filter(Boolean).join(", "));
  const hasMap = !!event.venue || !!event.address;

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="guest-eyebrow">Contact</p>
          <h1 className="guest-title">Get in Touch</h1>
          <p className="guest-subtitle mx-auto">Find all the details you need to join us.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Date & Time */}
          <div className="event-info-card">
            <p className="guest-eyebrow mb-2">When</p>
            {event.event_date ? (
              <>
                <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>{formatDate(event.event_date)}</p>
                {event.event_time && (
                  <p className="text-sm" style={{ color: "var(--event-muted)" }}>{to12Hour(event.event_time)}</p>
                )}
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--event-muted)" }}>Date to be announced</p>
            )}
          </div>

          {/* Venue */}
          <div className="event-info-card">
            <p className="guest-eyebrow mb-2">Where</p>
            {event.venue ? (
              <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>{event.venue}</p>
            ) : (
              <p className="text-sm" style={{ color: "var(--event-muted)" }}>Venue to be announced</p>
            )}
            {event.address && (
              <p className="text-sm" style={{ color: "var(--event-muted)" }}>{event.address}</p>
            )}
          </div>
        </div>

        {/* Embedded map */}
        {hasMap && (
          <div className="mt-6 overflow-hidden" style={{ borderRadius: "var(--event-radius)" }}>
            <iframe
              title="Event location map"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="w-full"
              style={{ height: "320px", border: "none" }}
              loading="lazy"
            />
          </div>
        )}

        {/* Contact card */}
        <div
          className="mt-6 rounded-lg p-6 text-center"
          style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text)", border: "1px solid var(--event-border)", borderRadius: "var(--event-radius)" }}
        >
          <p className="guest-eyebrow mb-2">Questions?</p>
          <p className="text-sm">
            If you have any questions about the event, please reach out to your host.
          </p>
        </div>
      </div>
    </section>
  );
}

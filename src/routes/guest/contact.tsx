import { useGuestOutletContext } from "./guest-layout";

export default function GuestContact() {
  const { event } = useGuestOutletContext();

  const mapEmbedUrl = event.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(
        `${event.venue || ""} ${event.address}`.trim()
      )}&output=embed`
    : null;

  return (
    <div className="animate-fadeIn">
      <section className="guest-section text-center">
        <p className="guest-eyebrow">Contact</p>
        <h1 className="guest-title">Get in Touch</h1>
        <p className="guest-subtitle mx-auto">
          Need more information? Here's how to reach us.
        </p>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Venue & Address */}
          {(event.venue || event.address) && (
            <div>
              <p className="guest-eyebrow">Venue</p>
              <h2 className="mb-3 text-2xl font-semibold" style={{ color: "var(--event-heading)" }}>
                {event.venue || "Location"}
              </h2>
              {event.address && (
                <p className="text-lg" style={{ color: "var(--event-text)" }}>
                  {event.address}
                </p>
              )}
            </div>
          )}

          {/* Date & Time */}
          {event.event_date && (
            <div>
              <p className="guest-eyebrow">Date & Time</p>
              <p className="text-lg" style={{ color: "var(--event-text)" }}>
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {event.event_time && ` at ${formatTimeDisplay(event.event_time)}`}
              </p>
            </div>
          )}

          {/* Map */}
          {mapEmbedUrl && (
            <div>
              <p className="guest-eyebrow">Location</p>
              <div className="mt-4 overflow-hidden" style={{ borderRadius: "var(--event-radius)" }}>
                <iframe
                  src={mapEmbedUrl}
                  title="Venue Map"
                  className="h-[400px] w-full"
                  style={{ border: `1px solid var(--event-border)` }}
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* No info fallback */}
          {!event.venue && !event.address && !event.event_date && (
            <div className="event-card text-center" style={{ color: "var(--event-muted)" }}>
              No contact information available for this event.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function formatTimeDisplay(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  if (isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${period}`;
}

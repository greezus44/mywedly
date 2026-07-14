import { useGuestOutletContext } from "./guest-layout";

export default function GuestContact() {
  const { event, theme } = useGuestOutletContext();

  const mapUrl =
    event.venue_map_url ||
    (event.venue_address
      ? `https://www.google.com/maps?q=${encodeURIComponent(event.venue_address)}&output=embed`
      : null);

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-4xl">
        {/* Centered header */}
        <div className="mb-12 text-center">
          <p className="guest-eyebrow">Contact</p>
          <h1 className="guest-title">Get in Touch</h1>
          <p className="guest-subtitle mx-auto">Details and directions for the big day.</p>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Venue section */}
          <section>
            <p className="guest-eyebrow">Venue</p>
            <h2 className="mb-2" style={{ color: theme.heading, fontFamily: theme.fontHeading, fontSize: "1.5rem" }}>
              {event.venue_name || "Venue to be announced"}
            </h2>
            {event.venue_address && (
              <p style={{ color: theme.text, lineHeight: 1.7 }}>{event.venue_address}</p>
            )}
            {event.venue_map_url && (
              <a
                href={event.venue_map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium hover:underline"
                style={{ color: theme.primary }}
              >
                Open in Maps →
              </a>
            )}
          </section>

          {/* When section */}
          <section>
            <p className="guest-eyebrow">When</p>
            <h2 className="mb-2" style={{ color: theme.heading, fontFamily: theme.fontHeading, fontSize: "1.5rem" }}>
              {event.event_date
                ? new Date(event.event_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Date to be announced"}
            </h2>
            {event.event_end_date && (
              <p style={{ color: theme.muted }}>
                through{" "}
                {new Date(event.event_end_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </section>
        </div>

        {/* Embedded map with rounded corners */}
        {mapUrl && (
          <div className="mt-10 overflow-hidden" style={{ borderRadius: "calc(var(--event-radius) * 2)", border: `1px solid ${theme.border}` }}>
            <iframe
              src={mapUrl}
              className="w-full"
              style={{ height: 360, border: "none" }}
              loading="lazy"
              title="Venue map"
            />
          </div>
        )}
      </div>
    </div>
  );
}

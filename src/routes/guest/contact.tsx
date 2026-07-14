import { useGuestOutletContext } from "./guest-layout";
import { formatDate, formatTime12 } from "../../lib/utils";

interface ContactInfo {
  email?: string | null;
  phone?: string | null;
  venue?: string | null;
  address?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
}

export default function GuestContact() {
  const { event, slug } = useGuestOutletContext();

  const email = (event.sharing_config as { email?: string } | null)?.email ?? null;
  const phone = (event.sharing_config as { phone?: string } | null)?.phone ?? null;
  const venue = event.venue;
  const address = event.address;
  const eventDate = event.event_date;
  const eventTime = event.event_time;

  const hasContact = Boolean(email || phone || venue || address || eventDate);
  const mapQuery = address || venue;
  const mapSrc = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : "";

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-3xl">
        {/* Heading */}
        <div className="mb-10 text-center">
          <p className="guest-eyebrow">Get in touch</p>
          <h1 className="guest-title">Contact</h1>
          <p className="guest-subtitle mx-auto">Reach us with any questions about the celebration.</p>
        </div>

        {/* Contact card */}
        <div
          className="event-card mb-8"
          style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text)" }}
        >
          <div className="space-y-6">
            {/* Date & time */}
            {eventDate && (
              <div>
                <p className="guest-eyebrow mb-1">When</p>
                <p className="text-base">
                  {formatDate(eventDate)}{eventTime && ` · ${formatTime12(eventTime)}`}
                </p>
              </div>
            )}

            {/* Venue */}
            {venue && (
              <div>
                <p className="guest-eyebrow mb-1">Where</p>
                <p className="text-base">{venue}</p>
                {address && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{address}</p>}
              </div>
            )}

            {/* Email */}
            {email && (
              <div>
                <p className="guest-eyebrow mb-1">Email</p>
                <a href={`mailto:${email}`} className="text-base hover:underline" style={{ color: "var(--event-primary)" }}>
                  {email}
                </a>
              </div>
            )}

            {/* Phone */}
            {phone && (
              <div>
                <p className="guest-eyebrow mb-1">Phone</p>
                <a href={`tel:${phone}`} className="text-base hover:underline" style={{ color: "var(--event-primary)" }}>
                  {phone}
                </a>
              </div>
            )}

            {!hasContact && (
              <p style={{ color: "var(--event-muted)" }}>Contact details will be added soon.</p>
            )}
          </div>
        </div>

        {/* Embedded map */}
        {mapSrc && (
          <div>
            <p className="guest-eyebrow mb-3">Location</p>
            <iframe
              title="Event location"
              src={mapSrc}
              width="100%"
              height={320}
              style={{ border: 0, borderRadius: "var(--event-radius)" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {/* Back link */}
        <div className="mt-10 text-center">
          <a href={`/e/${slug}/home`} className="text-sm hover:underline" style={{ color: "var(--event-muted)" }}>
            Back to home
          </a>
        </div>
      </div>
    </section>
  );
}

import { useGuestOutletContext } from "./guest-layout";

interface ContactConfig {
  phone?: string;
  email?: string;
  venue?: string;
  address?: string;
  mapQuery?: string;
}

export default function GuestContact() {
  const { event } = useGuestOutletContext();

  const sharingConfig = (event.sharing_config ?? {}) as ContactConfig;
  const contact: ContactConfig = {
    phone: sharingConfig.phone ?? undefined,
    email: sharingConfig.email ?? undefined,
    venue: sharingConfig.venue ?? event.venue ?? undefined,
    address: sharingConfig.address ?? event.address ?? undefined,
    mapQuery: sharingConfig.mapQuery ?? sharingConfig.address ?? event.address ?? event.venue ?? undefined,
  };

  const hasVenue = !!contact.venue;
  const hasAddress = !!contact.address;
  const hasPhone = !!contact.phone;
  const hasEmail = !!contact.email;
  const hasMap = !!contact.mapQuery;

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="guest-eyebrow">Contact</p>
          <h1 className="guest-title">Get in Touch</h1>
          <p className="guest-subtitle mx-auto">
            Have questions? Here's how to reach us.
          </p>
        </div>

        {/* Venue & Address */}
        {(hasVenue || hasAddress) && (
          <section className="mb-10">
            <p className="guest-eyebrow mb-3">Venue</p>
            <div className="event-card">
              {hasVenue && (
                <h2 className="mb-1 text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                  {contact.venue}
                </h2>
              )}
              {hasAddress && (
                <p style={{ color: "var(--event-muted)" }}>{contact.address}</p>
              )}
            </div>
          </section>
        )}

        {/* Phone & Email */}
        {(hasPhone || hasEmail) && (
          <section className="mb-10">
            <p className="guest-eyebrow mb-3">Reach Us</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {hasPhone && (
                <div className="event-card">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>
                    Phone
                  </p>
                  <a href={`tel:${contact.phone}`} className="font-medium hover:underline" style={{ color: "var(--event-primary)" }}>
                    {contact.phone}
                  </a>
                </div>
              )}
              {hasEmail && (
                <div className="event-card">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>
                    Email
                  </p>
                  <a href={`mailto:${contact.email}`} className="font-medium hover:underline break-all" style={{ color: "var(--event-primary)" }}>
                    {contact.email}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Map */}
        {hasMap && (
          <section>
            <p className="guest-eyebrow mb-3">Location</p>
            <div className="overflow-hidden" style={{ borderRadius: "var(--event-radius)", border: "1px solid var(--event-border)" }}>
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(contact.mapQuery!)}&output=embed`}
                className="h-72 w-full"
                loading="lazy"
                title="Event location map"
              />
            </div>
          </section>
        )}

        {/* Fallback */}
        {!hasVenue && !hasAddress && !hasPhone && !hasEmail && !hasMap && (
          <div className="text-center">
            <p className="guest-subtitle mx-auto">
              Contact information will be available soon. Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

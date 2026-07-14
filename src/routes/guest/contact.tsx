import { useGuestOutletContext } from "./guest-layout";

interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface ContactConfig {
  contacts?: ContactInfo[];
  venue_name?: string;
  venue_address?: string;
  venue_map_query?: string;
  map_query?: string;
  note?: string;
}

export default function GuestContact() {
  const { event } = useGuestOutletContext();

  const config = ((event.content ?? {}) as Record<string, unknown>).contact
    ? (((event.content as Record<string, unknown>).contact) as ContactConfig)
    : ({} as ContactConfig);

  const contacts = config.contacts ?? [];
  const venueName = config.venue_name || event.venue || "";
  const venueAddress = config.venue_address || event.address || "";
  const mapQuery = config.venue_map_query || config.map_query || venueAddress || venueName;
  const note = config.note ?? "";

  const hasContacts = contacts.length > 0;
  const hasVenue = Boolean(venueName || venueAddress);
  const hasAny = hasContacts || hasVenue;

  return (
    <div>
      {/* Header */}
      <section className="guest-section text-center">
        <div className="mx-auto max-w-2xl">
          <p className="guest-eyebrow">Contact</p>
          <h1 className="guest-title">Get in Touch</h1>
          <p className="guest-subtitle mx-auto">
            Have a question? Reach out using the information below.
          </p>
        </div>
      </section>

      {/* Contacts */}
      {hasContacts && (
        <section className="guest-section-tight">
          <div className="mx-auto max-w-3xl">
            <p className="guest-eyebrow mb-4">Who to Contact</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {contacts.map((c, i) => (
                <div
                  key={i}
                  className="event-card animate-slideUpStagger"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {c.role && <p className="guest-eyebrow mb-1">{c.role}</p>}
                  {c.name && (
                    <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                      {c.name}
                    </h3>
                  )}
                  <div className="space-y-1 text-sm" style={{ color: "var(--event-muted)" }}>
                    {c.email && (
                      <p>
                        <a href={`mailto:${c.email}`} className="hover:underline" style={{ color: "var(--event-primary)" }}>
                          {c.email}
                        </a>
                      </p>
                    )}
                    {c.phone && (
                      <p>
                        <a href={`tel:${c.phone}`} className="hover:underline" style={{ color: "var(--event-primary)" }}>
                          {c.phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Venue */}
      {hasVenue && (
        <section className="guest-section-tight">
          <div className="mx-auto max-w-3xl">
            <p className="guest-eyebrow mb-4">Venue</p>
            <div className="event-card">
              {venueName && (
                <h3 className="mb-1 text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                  {venueName}
                </h3>
              )}
              {venueAddress && (
                <p className="mb-4" style={{ color: "var(--event-muted)" }}>
                  {venueAddress}
                </p>
              )}
              {mapQuery && (
                <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "16 / 10" }}>
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                    className="h-full w-full"
                    loading="lazy"
                    title="Venue map"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Note */}
      {note && (
        <section className="guest-section-tight">
          <div className="mx-auto max-w-2xl">
            <p className="guest-eyebrow mb-3">Note</p>
            <p style={{ color: "var(--event-text)" }}>{note}</p>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasAny && !note && (
        <section className="guest-section text-center">
          <div className="event-card mx-auto max-w-md">
            <p className="guest-subtitle">No contact information has been provided yet. Check back soon.</p>
          </div>
        </section>
      )}
    </div>
  );
}

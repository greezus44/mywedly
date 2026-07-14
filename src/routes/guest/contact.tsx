import { useGuestOutletContext } from "./guest-layout";

interface ContactConfig {
  email?: string;
  phone?: string;
  address?: string;
  venue?: string;
  map_url?: string;
  notes?: string;
}

export default function GuestContact() {
  const { event } = useGuestOutletContext();

  const contact = ((event.content as Record<string, unknown> | null)?.contact ?? {}) as ContactConfig;
  const email = contact.email || null;
  const phone = contact.phone || null;
  const address = contact.address || event.address || null;
  const venue = contact.venue || event.venue || null;
  const notes = contact.notes || null;

  const mapQuery = address || venue;
  const mapSrc = contact.map_url || (mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null);

  const hasAny = email || phone || address || venue || notes;

  return (
    <div>
      {/* Header */}
      <section className="guest-section text-center">
        <div className="mx-auto max-w-2xl">
          <p className="guest-eyebrow">Contact</p>
          <h1 className="guest-title">Get in Touch</h1>
          <p className="guest-subtitle mx-auto">Questions? Reach out using the details below.</p>
        </div>
      </section>

      {!hasAny && !mapSrc ? (
        <section className="guest-section text-center">
          <p className="guest-subtitle mx-auto">No contact information has been provided yet.</p>
        </section>
      ) : (
        <section className="guest-section-tight">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Venue */}
            {venue && (
              <div>
                <p className="guest-eyebrow mb-2">Venue</p>
                <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>{venue}</p>
              </div>
            )}

            {/* Address */}
            {address && (
              <div>
                <p className="guest-eyebrow mb-2">Address</p>
                <p style={{ color: "var(--event-text)" }}>{address}</p>
              </div>
            )}

            {/* Contact details */}
            {(email || phone) && (
              <div className="grid gap-6 sm:grid-cols-2">
                {email && (
                  <div>
                    <p className="guest-eyebrow mb-2">Email</p>
                    <a href={`mailto:${email}`} className="hover:underline" style={{ color: "var(--event-primary)" }}>{email}</a>
                  </div>
                )}
                {phone && (
                  <div>
                    <p className="guest-eyebrow mb-2">Phone</p>
                    <a href={`tel:${phone}`} className="hover:underline" style={{ color: "var(--event-primary)" }}>{phone}</a>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div>
                <p className="guest-eyebrow mb-2">Notes</p>
                <p style={{ color: "var(--event-text)" }}>{notes}</p>
              </div>
            )}

            {/* Map */}
            {mapSrc && (
              <div>
                <p className="guest-eyebrow mb-3">Location</p>
                <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--event-border)" }}>
                  <iframe src={mapSrc} className="h-72 w-full" loading="lazy" title="Event location map" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

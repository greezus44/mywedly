import { useGuestOutletContext } from "./guest-layout";

interface ContactContent {
  phone?: string;
  email?: string;
  address?: string;
  venue?: string;
  map_url?: string;
  notes?: string;
}

export default function GuestContact() {
  const { event } = useGuestOutletContext();
  const content = (event.content ?? {}) as Record<string, unknown>;
  const contact = (content.contact ?? {}) as ContactContent;

  const venue = contact.venue ?? event.venue ?? "";
  const address = contact.address ?? event.address ?? "";
  const phone = contact.phone ?? "";
  const email = contact.email ?? "";
  const notes = contact.notes ?? "";

  const mapQuery = encodeURIComponent(`${venue} ${address}`.trim());
  const mapSrc = contact.map_url || (mapQuery ? `https://www.google.com/maps?q=${mapQuery}&output=embed` : "");

  const hasAny = venue || address || phone || email || notes;

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="guest-eyebrow">Contact</p>
          <h1 className="guest-title">Get in Touch</h1>
          <p className="guest-subtitle mx-auto">Reach out if you have any questions about {event.name}.</p>
        </div>

        {!hasAny && (
          <div className="py-12 text-center">
            <p className="guest-subtitle mx-auto">Contact details will be added soon.</p>
          </div>
        )}

        {hasAny && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Left: contact details */}
            <div className="space-y-8">
              {venue && (
                <section className="animate-slideUpStagger">
                  <p className="guest-eyebrow mb-2">Venue</p>
                  <p className="text-base font-medium" style={{ color: "var(--event-heading)" }}>{venue}</p>
                  {address && <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>{address}</p>}
                </section>
              )}

              {phone && (
                <section className="animate-slideUpStagger" style={{ animationDelay: "80ms" }}>
                  <p className="guest-eyebrow mb-2">Phone</p>
                  <a href={`tel:${phone}`} className="text-base hover:underline" style={{ color: "var(--event-text)" }}>
                    {phone}
                  </a>
                </section>
              )}

              {email && (
                <section className="animate-slideUpStagger" style={{ animationDelay: "160ms" }}>
                  <p className="guest-eyebrow mb-2">Email</p>
                  <a href={`mailto:${email}`} className="text-base hover:underline" style={{ color: "var(--event-text)" }}>
                    {email}
                  </a>
                </section>
              )}

              {notes && (
                <section className="animate-slideUpStagger" style={{ animationDelay: "240ms" }}>
                  <p className="guest-eyebrow mb-2">Notes</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--event-text)" }}>{notes}</p>
                </section>
              )}
            </div>

            {/* Right: map */}
            {mapSrc && (
              <div className="animate-slideUpStagger" style={{ animationDelay: "120ms" }}>
                <p className="guest-eyebrow mb-3">Location</p>
                <div className="overflow-hidden rounded-xl" style={{ borderRadius: "var(--event-radius)", border: "1px solid var(--event-border)" }}>
                  <iframe
                    src={mapSrc}
                    title="Event location map"
                    className="h-72 w-full"
                    loading="lazy"
                    style={{ border: 0 }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

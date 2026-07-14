import { useGuestOutletContext } from "./guest-layout";

interface ContactConfig {
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  map_embed_url?: string;
}

export default function GuestContact() {
  const { event } = useGuestOutletContext();
  const config = (event.content ?? {}) as ContactConfig;
  const sharingConfig = (event.sharing_config ?? {}) as ContactConfig;

  const email = config.contact_email || sharingConfig.contact_email || null;
  const phone = config.contact_phone || sharingConfig.contact_phone || null;
  const address = config.contact_address || sharingConfig.contact_address || event.address || event.venue || null;
  const mapUrl = config.map_embed_url || sharingConfig.map_embed_url || null;

  const hasContact = email || phone || address;

  return (
    <div>
      <section className="guest-section text-center">
        <div className="mx-auto max-w-2xl">
          <p className="guest-eyebrow">Contact</p>
          <h1 className="guest-title">Get in Touch</h1>
          <p className="guest-subtitle mx-auto">
            Have a question about {event.name}? Reach out using the details below.
          </p>
        </div>
      </section>

      <section className="guest-section-tight" style={{ backgroundColor: "var(--event-surface-alt)" }}>
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-6 md:grid-cols-3">
            {email && (
              <div className="event-card text-center">
                <p className="guest-eyebrow mb-2">Email</p>
                <a href={`mailto:${email}`} className="text-sm hover:underline break-words" style={{ color: "var(--event-primary)" }}>
                  {email}
                </a>
              </div>
            )}
            {phone && (
              <div className="event-card text-center">
                <p className="guest-eyebrow mb-2">Phone</p>
                <a href={`tel:${phone}`} className="text-sm hover:underline" style={{ color: "var(--event-primary)" }}>
                  {phone}
                </a>
              </div>
            )}
            {address && (
              <div className="event-card text-center">
                <p className="guest-eyebrow mb-2">Address</p>
                <p className="text-sm" style={{ color: "var(--event-text)" }}>{address}</p>
              </div>
            )}
          </div>
          {!hasContact && (
            <div className="text-center">
              <p className="guest-subtitle mx-auto">No contact information has been provided yet.</p>
            </div>
          )}
        </div>
      </section>

      {address && (
        <section className="guest-section-tight">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 text-center">
              <p className="guest-eyebrow">Location</p>
              <h2 className="text-xl font-semibold" style={{ color: "var(--event-heading)" }}>{address}</h2>
            </div>
            <div className="overflow-hidden rounded-2xl" style={{ borderRadius: "var(--event-radius)" }}>
              {mapUrl ? (
                <iframe
                  src={mapUrl}
                  title="Event location map"
                  className="h-80 w-full"
                  loading="lazy"
                  frameBorder={0}
                />
              ) : (
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                  title="Event location map"
                  className="h-80 w-full"
                  loading="lazy"
                  frameBorder={0}
                />
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

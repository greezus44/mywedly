import { useGuestOutletContext } from "./guest-layout";

interface ContactConfig {
  phone?: string | null;
  email?: string | null;
  venue?: string | null;
  address?: string | null;
  mapUrl?: string | null;
  mapQuery?: string | null;
}

function getMapEmbed(query: string): string {
  const q = encodeURIComponent(query);
  return `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
}

export default function GuestContact() {
  const { event } = useGuestOutletContext();
  const config = (event.content ?? {}) as ContactConfig;

  const phone = config.phone || null;
  const email = config.email || null;
  const venue = config.venue || event.venue || null;
  const address = config.address || event.address || null;
  const mapQuery = config.mapQuery || config.address || event.address || venue || "";
  const hasMap = !!mapQuery;

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 text-center">
          <p className="guest-eyebrow">Contact</p>
          <h1 className="guest-title">Get in touch</h1>
          <p className="guest-subtitle mx-auto">
            Questions about the celebration? Reach out using the details below.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {(phone || email) && (
            <section className="event-card">
              <p className="guest-eyebrow mb-2">Direct</p>
              <div className="space-y-3">
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="block transition-opacity hover:opacity-75"
                    style={{ color: "var(--event-text)" }}
                  >
                    <span className="block text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>
                      Phone
                    </span>
                    <span className="text-lg font-medium" style={{ color: "var(--event-heading)" }}>
                      {phone}
                    </span>
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="block transition-opacity hover:opacity-75"
                    style={{ color: "var(--event-text)" }}
                  >
                    <span className="block text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>
                      Email
                    </span>
                    <span className="text-lg font-medium" style={{ color: "var(--event-heading)" }}>
                      {email}
                    </span>
                  </a>
                )}
              </div>
            </section>
          )}

          {(venue || address) && (
            <section className="event-card">
              <p className="guest-eyebrow mb-2">Venue</p>
              <div className="space-y-1">
                {venue && (
                  <p className="text-lg font-medium" style={{ color: "var(--event-heading)" }}>
                    {venue}
                  </p>
                )}
                {address && (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--event-text)" }}>
                    {address}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {hasMap && (
          <section className="mt-8">
            <p className="guest-eyebrow mb-3">Map</p>
            <div
              className="overflow-hidden"
              style={{ borderRadius: "var(--event-radius)", border: "1px solid var(--event-border)" }}
            >
              <iframe
                title="Venue map"
                src={getMapEmbed(mapQuery)}
                className="h-80 w-full"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {!phone && !email && !venue && !address && (
          <div className="event-card mx-auto max-w-md text-center">
            <p className="guest-subtitle">Contact details haven't been shared yet. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

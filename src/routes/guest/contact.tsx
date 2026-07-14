import { useGuestOutletContext } from "./guest-layout";

interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  venue?: string;
  address?: string;
  mapUrl?: string;
}

function parseContact(content: unknown): ContactInfo {
  if (!content || typeof content !== "object") return {};
  return content as ContactInfo;
}

export default function GuestContact() {
  const { event } = useGuestOutletContext();
  const contact = parseContact(event.content);

  const venue = contact.venue || event.venue || "";
  const address = contact.address || event.address || "";
  const mapUrl = contact.mapUrl || (address ? `https://maps.google.com/?q=${encodeURIComponent(`${venue} ${address}`)}` : "");

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <p className="guest-eyebrow text-center">Contact</p>
        <h1 className="guest-title mb-8 text-center">Get in touch</h1>

        <div
          className="event-card mb-8 space-y-6"
          style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text)" }}
        >
          {venue && (
            <div>
              <p className="guest-eyebrow">Venue</p>
              <p style={{ color: "var(--event-text)" }}>{venue}</p>
              {address && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{address}</p>}
            </div>
          )}

          {contact.email && (
            <div>
              <p className="guest-eyebrow">Email</p>
              <a href={`mailto:${contact.email}`} style={{ color: "var(--event-primary)" }}>{contact.email}</a>
            </div>
          )}

          {contact.phone && (
            <div>
              <p className="guest-eyebrow">Phone</p>
              <a href={`tel:${contact.phone}`} style={{ color: "var(--event-primary)" }}>{contact.phone}</a>
            </div>
          )}

          {contact.name && (
            <div>
              <p className="guest-eyebrow">Contact Person</p>
              <p style={{ color: "var(--event-text)" }}>{contact.name}</p>
            </div>
          )}

          {!venue && !contact.email && !contact.phone && !contact.name && (
            <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>Contact details will be added soon.</p>
          )}
        </div>

        {mapUrl && (
          <div>
            <p className="guest-eyebrow mb-2">Location</p>
            <iframe
              src={mapUrl}
              title="Event location map"
              style={{ width: "100%", height: "320px", border: 0, borderRadius: "var(--event-radius)" }}
              loading="lazy"
            />
          </div>
        )}
      </div>
    </section>
  );
}

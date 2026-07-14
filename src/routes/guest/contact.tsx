import { useGuestOutletContext } from "./guest-layout";

export default function GuestContact() {
  const { event } = useGuestOutletContext();

  const content = (event.content ?? {}) as {
    contactPhone?: string;
    contactEmail?: string;
    contactAddress?: string;
    contactNote?: string;
    mapEmbedUrl?: string;
    mapQuery?: string;
  };

  const phone = content.contactPhone;
  const email = content.contactEmail;
  const address = content.contactAddress || event.address;
  const note = content.contactNote;
  const mapUrl = content.mapEmbedUrl;
  const mapQuery = content.mapQuery || event.venue || event.address;
  const googleMapsEmbed = mapUrl || (mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null);

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center animate-fadeIn">
          <p className="guest-eyebrow">Get In Touch</p>
          <h1 className="guest-title">Contact</h1>
          <p className="guest-subtitle mx-auto">
            Have a question? Here's how to reach us.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2">
          {phone && (
            <div className="event-card animate-slideUpStagger">
              <p className="guest-eyebrow">Phone</p>
              <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
              </p>
            </div>
          )}
          {email && (
            <div className="event-card animate-slideUpStagger" style={{ animationDelay: "60ms" }}>
              <p className="guest-eyebrow">Email</p>
              <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                <a href={`mailto:${email}`} className="hover:underline">{email}</a>
              </p>
            </div>
          )}
          {address && (
            <div className="event-card animate-slideUpStagger" style={{ animationDelay: "120ms" }}>
              <p className="guest-eyebrow">Address</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--event-text)" }}>
                {address}
              </p>
            </div>
          )}
          {note && (
            <div className="event-card animate-slideUpStagger" style={{ animationDelay: "180ms" }}>
              <p className="guest-eyebrow">Note</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--event-text)" }}>
                {note}
              </p>
            </div>
          )}
        </div>

        {/* Map */}
        {googleMapsEmbed && (
          <div className="animate-slideUp">
            <p className="guest-eyebrow mb-3">Location</p>
            <div className="overflow-hidden" style={{ borderRadius: "var(--event-radius)" }}>
              <iframe
                src={googleMapsEmbed}
                title="Event location map"
                className="h-80 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ borderRadius: "var(--event-radius)" }}
              />
            </div>
          </div>
        )}

        {/* Fallback if no contact info */}
        {!phone && !email && !address && !note && !googleMapsEmbed && (
          <div className="text-center animate-fadeIn">
            <p className="guest-subtitle mx-auto">
              Contact information has not been provided yet. Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

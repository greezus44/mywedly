import { useGuestOutletContext } from "./guest-layout";

interface ContactConfig {
  phone?: string;
  email?: string;
  address?: string;
  venue?: string;
  mapUrl?: string;
  contactName?: string;
  extraInfo?: string;
}

export default function GuestContact() {
  const { event } = useGuestOutletContext();
  const config = (event.content ?? {}) as Record<string, unknown>;
  const contact = (config.contact ?? {}) as ContactConfig;

  const sections: { eyebrow: string; title: string; items: { label: string; value: string }[] }[] = [];

  if (contact.venue || contact.address) {
    sections.push({
      eyebrow: "Location",
      title: contact.venue || "Venue",
      items: contact.address ? [{ label: "Address", value: contact.address }] : [],
    });
  }

  if (contact.phone || contact.email || contact.contactName) {
    const items: { label: string; value: string }[] = [];
    if (contact.contactName) items.push({ label: "Contact", value: contact.contactName });
    if (contact.phone) items.push({ label: "Phone", value: contact.phone });
    if (contact.email) items.push({ label: "Email", value: contact.email });
    sections.push({ eyebrow: "Get in Touch", title: "Contact Details", items });
  }

  if (contact.extraInfo) {
    sections.push({ eyebrow: "Additional Info", title: "Good to Know", items: [{ label: "", value: contact.extraInfo }] });
  }

  // Fallback to event-level fields if no contact config
  if (sections.length === 0) {
    const items: { label: string; value: string }[] = [];
    if (event.venue) items.push({ label: "Venue", value: event.venue });
    if (event.address) items.push({ label: "Address", value: event.address });
    if (items.length > 0) {
      sections.push({ eyebrow: "Location", title: event.venue || "Venue", items });
    }
  }

  const mapUrl = contact.mapUrl || (event.address ? `https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed` : "");

  return (
    <div>
      {/* Header */}
      <section className="guest-section text-center">
        <div className="mx-auto max-w-2xl">
          <p className="guest-eyebrow">Contact</p>
          <h1 className="guest-title">Get in Touch</h1>
          <p className="guest-subtitle mx-auto">
            Have questions about {event.name}? Here's everything you need to reach us.
          </p>
        </div>
      </section>

      {/* Contact Sections */}
      {sections.length > 0 && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-4xl space-y-8">
            {sections.map((section, i) => (
              <div key={i} className="animate-slideUpStagger" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="guest-eyebrow mb-2">{section.eyebrow}</p>
                <h2 className="mb-4 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>
                  {section.title}
                </h2>
                <div className="event-card space-y-3">
                  {section.items.map((item, j) => (
                    <div key={j} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                      {item.label && (
                        <span className="text-sm font-medium shrink-0 sm:w-28" style={{ color: "var(--event-muted)" }}>
                          {item.label}
                        </span>
                      )}
                      <span className="text-sm" style={{ color: "var(--event-text)" }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Map */}
      {mapUrl && (
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-4xl">
            <p className="guest-eyebrow mb-2 text-center">Find Us</p>
            <h2 className="mb-6 text-center text-xl font-semibold" style={{ color: "var(--event-heading)" }}>
              Location Map
            </h2>
            <div className="overflow-hidden rounded-2xl" style={{ borderRadius: "var(--event-radius)", border: "1px solid var(--event-border)" }}>
              <div className="relative w-full" style={{ paddingBottom: "45%" }}>
                <iframe
                  src={mapUrl}
                  title="Location Map"
                  className="absolute inset-0 h-full w-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {sections.length === 0 && !mapUrl && (
        <section className="px-6 pb-16 text-center">
          <p className="guest-subtitle mx-auto">Contact details will be added soon. Check back later!</p>
        </section>
      )}
    </div>
  );
}

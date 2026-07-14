import React from "react";
import { useGuestOutletContext } from "./guest-layout";
import { RichTextContent } from "../../lib/sanitize";

export default function Contact(): React.ReactElement {
  const { event } = useGuestOutletContext();
  const content = (event.content as Record<string, unknown> | null) ?? {};
  const contactHtml = (content.contact as string) || "";

  const mapUrl = event.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed`
    : null;

  return (
    <div className="guest-section">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center animate-fadeIn">
        <p className="guest-eyebrow">Contact</p>
        <h2 className="guest-title">Get In Touch</h2>
        <p className="guest-subtitle mt-2 mx-auto">
          If you have any questions, here's how to reach us.
        </p>
      </div>

      {/* Venue Section */}
      {event.venue && (
        <div className="mx-auto mt-12 max-w-3xl animate-slideUp">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="event-info-card">
              <p className="guest-eyebrow">Venue</p>
              <h3 className="mt-2 text-lg font-semibold text-event-heading">{event.venue}</h3>
              {event.address && (
                <p className="mt-2 text-sm text-event-muted">{event.address}</p>
              )}
            </div>
            <div className="event-info-card">
              <p className="guest-eyebrow">Date & Time</p>
              <h3 className="mt-2 text-lg font-semibold text-event-heading">
                {event.event_date
                  ? new Date(event.event_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "TBD"}
              </h3>
              {event.event_time && (
                <p className="mt-2 text-sm text-event-muted">
                  {(() => {
                    const [h, m] = event.event_time.split(":");
                    const hh = parseInt(h, 10);
                    const period = hh >= 12 ? "PM" : "AM";
                    const h12 = hh % 12 === 0 ? 12 : hh % 12;
                    return `${h12}:${m} ${period}`;
                  })()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      {mapUrl && (
        <div className="mx-auto mt-8 max-w-3xl animate-fadeIn">
          <div className="overflow-hidden rounded-2xl border border-event-border" style={{ borderRadius: "calc(var(--event-radius) * 2)" }}>
            <iframe
              src={mapUrl}
              title="Venue Map"
              className="h-80 w-full"
              loading="lazy"
              style={{ border: 0 }}
            />
          </div>
        </div>
      )}

      {/* Contact content */}
      {contactHtml && (
        <div className="mx-auto mt-12 max-w-2xl text-center animate-slideUp">
          <p className="guest-eyebrow">Additional Info</p>
          <div className="mt-4">
            <RichTextContent html={contactHtml} />
          </div>
        </div>
      )}
    </div>
  );
}

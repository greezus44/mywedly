import React from "react";
import { useOutletContext } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";

export default function GuestContact() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const sharingConfig = (event.sharing_config || {}) as Record<string, any>;
  const contactPhone = sharingConfig.contactPhone || sharingConfig.phone || null;
  const mapsUrl = sharingConfig.mapsUrl || sharingConfig.maps_url || null;

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-event text-2xl mb-6 text-center" style={{ color: "var(--event-heading)" }}>
        Contact & Venue
      </h2>

      <div
        className="rounded-xl p-6 space-y-5"
        style={{ backgroundColor: "var(--event-surface)", border: "1px solid var(--event-border)" }}
      >
        {/* Venue */}
        {event.venue && (
          <div>
            <h3 className="font-event text-sm uppercase tracking-wide mb-1" style={{ color: "var(--event-muted)" }}>
              Venue
            </h3>
            <p className="text-base" style={{ color: "var(--event-text)" }}>
              {event.venue}
            </p>
          </div>
        )}

        {/* Address */}
        {event.address && (
          <div>
            <h3 className="font-event text-sm uppercase tracking-wide mb-1" style={{ color: "var(--event-muted)" }}>
              Address
            </h3>
            <p className="text-base whitespace-pre-wrap" style={{ color: "var(--event-text)" }}>
              {event.address}
            </p>
          </div>
        )}

        {/* Contact phone */}
        {contactPhone && (
          <div>
            <h3 className="font-event text-sm uppercase tracking-wide mb-1" style={{ color: "var(--event-muted)" }}>
              Contact
            </h3>
            <a
              href={`tel:${contactPhone}`}
              className="text-base underline"
              style={{ color: "var(--event-primary)" }}
            >
              {contactPhone}
            </a>
          </div>
        )}

        {/* Map link */}
        {mapsUrl && (
          <div>
            <h3 className="font-event text-sm uppercase tracking-wide mb-1" style={{ color: "var(--event-muted)" }}>
              Location
            </h3>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base underline inline-flex items-center gap-1"
              style={{ color: "var(--event-primary)" }}
            >
              View on Map
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}

        {/* Event date */}
        {event.event_date && (
          <div>
            <h3 className="font-event text-sm uppercase tracking-wide mb-1" style={{ color: "var(--event-muted)" }}>
              Date
            </h3>
            <p className="text-base" style={{ color: "var(--event-text)" }}>
              {new Date(event.event_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {event.event_time && ` at ${event.event_time}`}
            </p>
          </div>
        )}
      </div>

      {/* Map embed if available */}
      {mapsUrl && (
        <div className="mt-6 rounded-xl overflow-hidden" style={{ border: "1px solid var(--event-border)" }}>
          <iframe
            src={mapsUrl}
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Map"
          />
        </div>
      )}

      {/* Fallback if no venue info */}
      {!event.venue && !event.address && !contactPhone && !mapsUrl && (
        <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>
          Contact information has not been provided yet.
        </p>
      )}
    </div>
  );
}

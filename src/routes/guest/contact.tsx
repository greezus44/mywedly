import React from "react";
import { useOutletContext } from "react-router-dom";
import { type UserEvent } from "../../lib/supabase";
import { formatDate, formatTime12 } from "../../lib/utils";

export default function Contact() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const mapLink = event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [event.venue, event.address].filter(Boolean).join(", "),
      )}`
    : null;

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-bold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
          Contact & Venue
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>
          Find all the details about the venue and how to get there.
        </p>

        {/* Venue details */}
        <div className="mt-6 event-card">
          <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
            Venue
          </h3>
          {event.venue ? (
            <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>
              {event.venue}
            </p>
          ) : (
            <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>
              Venue to be announced.
            </p>
          )}

          {event.address && (
            <>
              <h4 className="mt-4 text-sm font-semibold uppercase" style={{ color: "var(--event-muted)" }}>
                Address
              </h4>
              <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>
                {event.address}
              </p>
            </>
          )}

          {(event.event_date || event.event_time) && (
            <>
              <h4 className="mt-4 text-sm font-semibold uppercase" style={{ color: "var(--event-muted)" }}>
                When
              </h4>
              <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>
                {formatDate(event.event_date)}
                {event.event_time ? ` at ${formatTime12(event.event_time)}` : ""}
              </p>
            </>
          )}
        </div>

        {/* Map link */}
        {mapLink && (
          <div className="mt-4 event-card text-center">
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="event-btn-primary inline-block"
            >
              📍 View on Map
            </a>
          </div>
        )}

        {/* Embedded map */}
        {event.address && (
          <div className="mt-4 overflow-hidden event-card" style={{ padding: 0 }}>
            <iframe
              title="Venue map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                [event.venue, event.address].filter(Boolean).join(", "),
              )}&output=embed`}
              className="w-full"
              style={{ height: 300, border: 0 }}
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}

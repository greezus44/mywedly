import React from "react";
import { useOutletContext } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime12 } from "../../lib/utils";
import { MapPin, Calendar, Clock, Navigation } from "lucide-react";

export default function GuestContactPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const venue = event.venue;
  const address = event.address;
  const date = event.event_date;
  const time = event.event_time;

  const mapsUrl = address
    ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
    : venue
    ? `https://maps.google.com/?q=${encodeURIComponent(venue)}`
    : null;

  return (
    <div className="event-themed flex min-h-screen flex-col items-center px-6 py-12">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="text-center">
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "var(--event-heading-font)", color: "var(--event-text)" }}
          >
            Venue & Contact
          </h1>
          <p
            className="mt-1 text-sm opacity-70"
            style={{ color: "var(--event-text)" }}
          >
            {event.name || "Event details"}
          </p>
        </div>

        {/* Info cards */}
        <div className="flex flex-col gap-4">
          {/* Date & Time */}
          {(date || time) && (
            <div
              className="flex items-start gap-4 rounded-lg border p-5"
              style={{
                borderColor: "var(--event-border)",
                backgroundColor: "var(--event-surface)",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--event-primary)" }}
              >
                <Calendar className="h-5 w-5" style={{ color: "var(--event-bg)" }} />
              </div>
              <div className="flex-1">
                <h3
                  className="text-sm font-semibold uppercase tracking-wider opacity-60"
                  style={{ color: "var(--event-text)" }}
                >
                  Date & Time
                </h3>
                {date && (
                  <p
                    className="mt-1 text-base font-medium"
                    style={{ color: "var(--event-text)" }}
                  >
                    {formatDate(date)}
                  </p>
                )}
                {time && (
                  <p
                    className="mt-1 flex items-center gap-1.5 text-sm opacity-70"
                    style={{ color: "var(--event-text)" }}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime12(time)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Venue */}
          {venue && (
            <div
              className="flex items-start gap-4 rounded-lg border p-5"
              style={{
                borderColor: "var(--event-border)",
                backgroundColor: "var(--event-surface)",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--event-primary)" }}
              >
                <MapPin className="h-5 w-5" style={{ color: "var(--event-bg)" }} />
              </div>
              <div className="flex-1">
                <h3
                  className="text-sm font-semibold uppercase tracking-wider opacity-60"
                  style={{ color: "var(--event-text)" }}
                >
                  Venue
                </h3>
                <p
                  className="mt-1 text-base font-medium"
                  style={{ color: "var(--event-text)" }}
                >
                  {venue}
                </p>
                {address && (
                  <p
                    className="mt-1 text-sm opacity-70"
                    style={{ color: "var(--event-text)" }}
                  >
                    {address}
                  </p>
                )}
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm underline"
                    style={{ color: "var(--event-primary)" }}
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Get Directions
                  </a>
                )}
              </div>
            </div>
          )}

          {/* No info */}
          {!venue && !date && !time && !address && (
            <div
              className="rounded-lg border p-8 text-center"
              style={{
                borderColor: "var(--event-border)",
                backgroundColor: "var(--event-surface)",
              }}
            >
              <p
                className="text-sm opacity-60"
                style={{ color: "var(--event-text)" }}
              >
                No venue or contact information available for this event.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

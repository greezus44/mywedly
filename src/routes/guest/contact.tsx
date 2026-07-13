import { useOutletContext } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime12 } from "../../lib/utils";
import { themeToEventCssVars } from "../../lib/theme";
import { MapPin, Calendar, Clock } from "lucide-react";

export default function GuestContactPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const cssVars = themeToEventCssVars(event.theme);

  return (
    <div className="event-themed min-h-screen" style={cssVars}>
      <section className="px-6 py-12">
        <div className="mx-auto max-w-lg">
          <h2 className="font-heading text-center text-3xl">Contact &amp; Details</h2>
          <p className="font-body mt-2 text-center text-sm text-muted">
            Everything you need to know about {event.name}.
          </p>

          <div className="mt-8 space-y-4">
            {/* Date */}
            {event.event_date && (
              <div
                className="flex items-start gap-3 rounded-lg bg-surface p-4"
                style={{ boxShadow: "var(--event-shadow)" }}
              >
                <Calendar className="mt-0.5 h-5 w-5 text-muted" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Date
                  </p>
                  <p className="mt-1 text-sm text-current">
                    {formatDate(event.event_date)}
                  </p>
                </div>
              </div>
            )}

            {/* Time */}
            {event.event_time && (
              <div
                className="flex items-start gap-3 rounded-lg bg-surface p-4"
                style={{ boxShadow: "var(--event-shadow)" }}
              >
                <Clock className="mt-0.5 h-5 w-5 text-muted" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Time
                  </p>
                  <p className="mt-1 text-sm text-current">
                    {formatTime12(event.event_time)}
                  </p>
                </div>
              </div>
            )}

            {/* Venue */}
            {event.venue && (
              <div
                className="flex items-start gap-3 rounded-lg bg-surface p-4"
                style={{ boxShadow: "var(--event-shadow)" }}
              >
                <MapPin className="mt-0.5 h-5 w-5 text-muted" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Venue
                  </p>
                  <p className="mt-1 text-sm text-current">{event.venue}</p>
                </div>
              </div>
            )}

            {/* Address */}
            {event.address && (
              <div
                className="flex items-start gap-3 rounded-lg bg-surface p-4"
                style={{ boxShadow: "var(--event-shadow)" }}
              >
                <MapPin className="mt-0.5 h-5 w-5 text-muted" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Address
                  </p>
                  <p className="mt-1 text-sm text-current">{event.address}</p>
                  {event.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-medium underline"
                      style={{ color: "var(--event-primary)" }}
                    >
                      Open in Google Maps →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

import { useOutletContext } from "react-router-dom";
import { MapPin, Calendar, Clock } from "lucide-react";
import { type UserEvent } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";

export default function GuestContactPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-10" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
      <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--event-font-heading)" }}>
        Contact & Venue
      </h1>

      <div className="w-full max-w-md flex flex-col gap-4">
        {event.event_date && (
          <div
            className="flex items-start gap-3 rounded-md border p-4"
            style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}
          >
            <Calendar className="h-5 w-5 mt-0.5" style={{ color: "var(--event-primary)" }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--event-text)" }}>
                Date
              </h3>
              <p className="text-sm" style={{ color: "var(--event-text-muted)" }}>
                {formatDate(event.event_date)}
              </p>
            </div>
          </div>
        )}

        {event.event_time && (
          <div
            className="flex items-start gap-3 rounded-md border p-4"
            style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}
          >
            <Clock className="h-5 w-5 mt-0.5" style={{ color: "var(--event-primary)" }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--event-text)" }}>
                Time
              </h3>
              <p className="text-sm" style={{ color: "var(--event-text-muted)" }}>
                {formatTime(event.event_time)}
              </p>
            </div>
          </div>
        )}

        {event.venue && (
          <div
            className="flex items-start gap-3 rounded-md border p-4"
            style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}
          >
            <MapPin className="h-5 w-5 mt-0.5" style={{ color: "var(--event-primary)" }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--event-text)" }}>
                Venue
              </h3>
              <p className="text-sm" style={{ color: "var(--event-text-muted)" }}>
                {event.venue}
              </p>
              {event.address && (
                <p className="mt-1 text-sm" style={{ color: "var(--event-text-muted)" }}>
                  {event.address}
                </p>
              )}
            </div>
          </div>
        )}

        {event.venue && event.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(`${event.venue} ${event.address}`)}`}
            target="_blank"
            rel="noreferrer"
            style={{ backgroundColor: "var(--event-primary)", color: "#fff", borderRadius: "var(--event-radius)" }}
            className="px-6 py-2 text-center text-sm font-medium"
          >
            Open in Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

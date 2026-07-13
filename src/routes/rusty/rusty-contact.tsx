import { Link, useOutletContext } from "react-router-dom";
import { MapPin, Clock, Calendar, Navigation } from "lucide-react";
import { formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { useRustyOutletContext } from "./rusty-layout";

export type Lang = "en" | "id";

/**
 * RustyContact — contact and venue info with cream/gold styling.
 * Shows venue, address, date/time, and a map placeholder.
 */
export default function RustyContact() {
  const { event } = useRustyOutletContext();
  const headingFont: React.CSSProperties = { fontFamily: "var(--event-font-heading)" };
  const scriptFont: React.CSSProperties = { fontFamily: "var(--event-font-script)" };

  const mapQuery = [event.venue, event.address].filter(Boolean).join(", ");
  const mapUrl = mapQuery
    ? `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`
    : "https://maps.google.com";

  const GoldDivider = () => (
    <div className="flex items-center justify-center gap-4 my-6">
      <div className="h-px w-16" style={{ backgroundColor: "var(--event-primary)" }} />
      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "var(--event-primary)" }} />
      <div className="h-px w-16" style={{ backgroundColor: "var(--event-primary)" }} />
    </div>
  );

  return (
    <div className="min-h-screen px-6 py-16" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <MapPin className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--event-primary)" }} />
          <h1 className="text-4xl mb-2" style={headingFont}>Venue & Contact</h1>
          <p className="text-sm" style={{ ...scriptFont, color: "var(--event-text-muted)" }}>
            Everything you need to find your way
          </p>
        </div>
        <GoldDivider />

        {/* Event details card */}
        <div
          className="p-8 border mb-8"
          style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)", borderRadius: "var(--event-radius)" }}
        >
          <h2 className="text-2xl mb-6 text-center" style={headingFont}>{event.name}</h2>
          <div className="space-y-4">
            {event.event_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--event-primary)" }} />
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--event-text-muted)" }}>Date</p>
                  <p className="text-sm" style={{ ...scriptFont, color: "var(--event-text)" }}>{formatDate(event.event_date)}</p>
                </div>
              </div>
            )}
            {event.event_time && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--event-primary)" }} />
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--event-text-muted)" }}>Time</p>
                  <p className="text-sm" style={{ ...scriptFont, color: "var(--event-text)" }}>{formatTime(event.event_time)}</p>
                </div>
              </div>
            )}
            {event.venue && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--event-primary)" }} />
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--event-text-muted)" }}>Venue</p>
                  <p className="text-sm" style={{ ...scriptFont, color: "var(--event-text)" }}>{event.venue}</p>
                </div>
              </div>
            )}
            {event.address && (
              <div className="flex items-start gap-3">
                <Navigation className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--event-primary)" }} />
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--event-text-muted)" }}>Address</p>
                  <p className="text-sm" style={{ ...scriptFont, color: "var(--event-text)" }}>{event.address}</p>
                </div>
              </div>
            )}
          </div>

          {(event.venue || event.address) && (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-6">
              <Button
                variant="secondary"
                style={{ borderColor: "var(--event-primary)", color: "var(--event-primary)", borderRadius: "var(--event-radius)" }}
              >
                <Navigation className="w-4 h-4" /> Open in Maps
              </Button>
            </a>
          )}
        </div>

        {/* Map placeholder */}
        <div
          className="border overflow-hidden"
          style={{ borderColor: "var(--event-border)", borderRadius: "var(--event-radius)", backgroundColor: "var(--event-surface)" }}
        >
          <div
            className="h-64 flex items-center justify-center"
            style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text-muted)" }}
          >
            <div className="text-center">
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" style={{ color: "var(--event-primary)" }} />
              <p className="text-sm" style={{ ...scriptFont, color: "var(--event-text-muted)" }}>Map preview</p>
              <p className="text-xs mt-1" style={{ color: "var(--event-text-muted)" }}>
                Click "Open in Maps" for directions
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link to="home" className="text-sm hover:underline" style={{ color: "var(--event-text-muted)" }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

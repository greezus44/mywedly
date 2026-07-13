import React from "react";
import { useOutletContext } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { formatDate, formatTime12 } from "../../lib/utils";
import { MapPin, Calendar, Clock } from "lucide-react";

export default function GuestContact() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const mapsUrl = event.address ? `https://maps.google.com/?q=${encodeURIComponent(event.address)}` : null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-serif mb-6" style={{ color: "var(--event-primary)" }}>Event Details</h2>
        <div className="space-y-4">
          {event.event_date && <p className="flex items-center justify-center gap-2"><Calendar className="w-5 h-5" /> {formatDate(event.event_date)}</p>}
          {event.event_time && <p className="flex items-center justify-center gap-2"><Clock className="w-5 h-5" /> {formatTime12(event.event_time)}</p>}
          {event.venue && <p className="flex items-center justify-center gap-2"><MapPin className="w-5 h-5" /> {event.venue}</p>}
          {event.address && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{event.address}</p>}
          {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener" className="inline-block text-sm px-4 py-2 rounded-lg text-white" style={{ background: "var(--event-primary)" }}>Open in Maps</a>}
        </div>
      </div>
    </div>
  );
}

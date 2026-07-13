import React from "react";
import { useOutletContext } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { Mail, Phone, MapPin } from "lucide-react";

export default function GuestContact() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  return (
    <div className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-serif mb-6" style={{ color: "var(--event-primary)" }}>Contact</h2>
      <div className="space-y-4">
        {event.venue && (
          <div className="flex items-center justify-center gap-2"><MapPin className="w-5 h-5" style={{ color: "var(--event-primary)" }} /><span>{event.venue}</span></div>
        )}
        {event.address && (
          <div className="flex items-center justify-center gap-2"><MapPin className="w-5 h-5" style={{ color: "var(--event-primary)" }} /><span className="event-muted-text">{event.address}</span></div>
        )}
      </div>
    </div>
  );
}

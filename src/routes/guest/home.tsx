import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown, formatDate, formatTime12 } from "../../lib/utils";
import { Calendar, Clock, MapPin } from "lucide-react";

export default function GuestHome() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const content = event.content || {};
  const [countdown, setCountdown] = useState(getCountdown(event.event_date));

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown(event.event_date)), 1000);
    return () => clearInterval(timer);
  }, [event.event_date]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {content.title && <RichTextContent html={content.title} className="text-3xl font-serif text-center mb-4" />}
        {content.subtitle && <RichTextContent html={content.subtitle} className="text-lg text-center mb-4 event-muted-text" />}
        {content.body && <RichTextContent html={content.body} className="text-base leading-relaxed mb-8" />}
        {!countdown.isPast && (
          <div className="text-center mb-8">
            <div className="flex gap-4 justify-center">
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Minutes", value: countdown.minutes },
                { label: "Seconds", value: countdown.seconds },
              ].map((t) => (
                <div key={t.label} className="text-center">
                  <div className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>{t.value}</div>
                  <div className="text-xs" style={{ color: "var(--event-muted)" }}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="text-center space-y-2 mb-8">
          {event.event_date && <p className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(event.event_date)}</p>}
          {event.event_time && <p className="flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> {formatTime12(event.event_time)}</p>}
          {event.venue && <p className="flex items-center justify-center gap-2"><MapPin className="w-4 h-4" /> {event.venue}</p>}
        </div>
        <div className="flex gap-3 justify-center">
          <Link to={`/e/${event.slug}/rsvp`} className="px-6 py-3 rounded-lg text-white" style={{ background: "var(--event-primary)" }}>RSVP</Link>
          <Link to={`/e/${event.slug}/wishes`} className="px-6 py-3 rounded-lg border" style={{ borderColor: "var(--event-border)", color: "var(--event-text)" }}>Wishes</Link>
        </div>
      </div>
    </div>
  );
}

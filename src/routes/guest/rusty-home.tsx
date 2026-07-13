import React from "react";
import { useOutletContext, Link } from "react-router-dom";
import type { UserEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

export default function RustyHome() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const content = event.content || {};
  const cfg = event.cover_config || {};
  const countdown = getCountdown(event.event_date);

  return (
    <div className="space-y-8">
      {cfg.cover_image && <img src={cfg.cover_image} alt="" className="w-full max-h-64 object-cover rounded-xl" style={{ border: "2px solid var(--event-border)" }} />}
      {content.title && <RichTextContent html={content.title} className="text-3xl md:text-4xl font-serif text-center" />}
      {content.subtitle && <RichTextContent html={content.subtitle} className="text-lg text-center event-muted-text" />}
      {content.body && <RichTextContent html={content.body} className="text-base leading-relaxed" />}
      {event.event_date && !countdown.isPast && (
        <div className="text-center py-6 rounded-xl" style={{ background: "var(--event-surface)", border: "2px solid var(--event-border)" }}>
          <h3 className="text-xl font-serif mb-4" style={{ color: "var(--event-primary)" }}>Counting Down</h3>
          <div className="flex justify-center gap-4">
            <div className="text-center"><p className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>{countdown.days}</p><p className="text-sm event-muted-text">Days</p></div>
            <div className="text-center"><p className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>{countdown.hours}</p><p className="text-sm event-muted-text">Hours</p></div>
            <div className="text-center"><p className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>{countdown.minutes}</p><p className="text-sm event-muted-text">Minutes</p></div>
          </div>
        </div>
      )}
      <div className="text-center py-4 border-t" style={{ borderColor: "var(--event-border)" }}>
        <p className="text-sm event-muted-text mb-2">{formatDate(event.event_date)} {event.event_time && `at ${formatTime12(event.event_time)}`}</p>
        {event.venue && <p className="text-sm event-muted-text">{event.venue}</p>}
        <Link to="rsvp" className="inline-block mt-4 px-6 py-2.5 rounded-lg text-white font-medium" style={{ background: "var(--event-primary)" }}>RSVP Now</Link>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { type UserEvent, type EventContent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown, formatTime } from "../../lib/utils";

export default function GuestHomePage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const content: EventContent = event.content ?? {};
  const [countdown, setCountdown] = useState(getCountdown(event.event_date));

  useEffect(() => {
    if (!event.event_date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(event.event_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [event.event_date]);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-10" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
      {content.rich_title ? (
        <RichTextContent html={content.rich_title} />
      ) : (
        <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--event-font-heading)" }}>
          {event.name || "Your Event"}
        </h1>
      )}

      {content.rich_subtitle && <RichTextContent html={content.rich_subtitle} />}

      {(event.event_date || event.event_time || event.venue) && (
        <div className="flex flex-col items-center gap-1 text-sm" style={{ color: "var(--event-text-muted)" }}>
          {event.event_date && (
            <span>
              {new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
          )}
          {event.event_time && <span>{formatTime(event.event_time)}</span>}
          {event.venue && <span>{event.venue}</span>}
        </div>
      )}

      {!countdown.isPast && event.event_date && (
        <div className="flex gap-4">
          {[
            { label: "Days", value: countdown.days },
            { label: "Hours", value: countdown.hours },
            { label: "Min", value: countdown.minutes },
            { label: "Sec", value: countdown.seconds },
          ].map((u) => (
            <div key={u.label} className="flex flex-col items-center">
              <span className="text-2xl font-bold" style={{ color: "var(--event-primary)" }}>
                {u.value}
              </span>
              <span className="text-xs uppercase" style={{ color: "var(--event-text-muted)" }}>
                {u.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {content.rich_body && <RichTextContent html={content.rich_body} />}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="rsvp"
          style={{ backgroundColor: "var(--event-primary)", color: "#fff", borderRadius: "var(--event-radius)" }}
          className="px-6 py-2 text-sm font-medium"
        >
          {content.rsvp_button_text || "RSVP"}
        </Link>
        <Link
          to="wishes"
          style={{ backgroundColor: "var(--event-surface)", color: "var(--event-text)", border: "1px solid var(--event-border)", borderRadius: "var(--event-radius)" }}
          className="px-6 py-2 text-sm font-medium"
        >
          Leave a wish
        </Link>
        <Link
          to="contact"
          style={{ color: "var(--event-text-muted)" }}
          className="px-2 py-2 text-sm font-medium underline"
        >
          Contact info
        </Link>
      </div>
    </div>
  );
}

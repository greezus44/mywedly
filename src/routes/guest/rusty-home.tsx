import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { type UserEvent, type SubEvent, supabase } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface HomeContent { section1?: string; section2?: string; section3?: string; [k: string]: any }

export default function RustyHome() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const [countdown, setCountdown] = useState(() => getCountdown(event.event_date));

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(event.event_date)), 1000);
    return () => clearInterval(interval);
  }, [event.event_date]);

  const { data: subEvents } = useQuery({
    queryKey: ["rusty_sub_events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const content = (event.content ?? {}) as HomeContent;
  const countdownItems = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Min", value: countdown.minutes },
    { label: "Sec", value: countdown.seconds },
  ];

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="font-event text-3xl md:text-4xl text-event-heading">{event.name}</h1>
        {event.event_date && !countdown.isPast && (
          <div className="mt-6 flex justify-center gap-6">
            {countdownItems.map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-3xl font-bold text-event-primary">{String(item.value).padStart(2, "0")}</div>
                <div className="text-xs text-event-muted">{item.label}</div>
              </div>
            ))}
          </div>
        )}
        {event.event_date && countdown.isPast && (
          <p className="mt-4 font-event-body text-lg text-event-muted">The event day has arrived!</p>
        )}
      </div>

      {content.section1 && <RichTextContent html={content.section1} className="max-w-2xl mx-auto" />}
      {content.section2 && <RichTextContent html={content.section2} className="max-w-2xl mx-auto" />}
      {content.section3 && <RichTextContent html={content.section3} className="max-w-2xl mx-auto" />}

      {subEvents && subEvents.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <h2 className="font-event text-2xl text-event-heading text-center mb-6">Events</h2>
          <div className="space-y-4">
            {subEvents.map((se) => (
              <div key={se.id} className="event-card border-2 border-event-border">
                <h3 className="font-event text-xl text-event-heading">{se.name}</h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-event-muted">
                  {se.date && <span>{formatDate(se.date)}</span>}
                  {se.start_time && <span>{formatTime12(se.start_time)}{se.end_time ? ` – ${formatTime12(se.end_time)}` : ""}</span>}
                  {se.venue && <span>{se.venue}</span>}
                </div>
                {se.description && <p className="mt-2 text-sm text-event-text">{se.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

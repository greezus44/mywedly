import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type Json } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface EventContent {
  section1?: string;
  section2?: string;
  section3?: string;
  welcome?: string;
  home?: string;
}

function parseContent(content: Json | null | undefined): EventContent {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    return content as EventContent;
  }
  return {};
}

function useCountdown(targetDate: string | null | undefined) {
  const [countdown, setCountdown] = useState(() => getCountdown(targetDate));
  useEffect(() => {
    setCountdown(getCountdown(targetDate));
    const id = setInterval(() => setCountdown(getCountdown(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return countdown;
}

export default function RustyHome() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const content = parseContent(event.content);
  const countdown = useCountdown(event.event_date);

  const { data: subEvents } = useQuery({
    queryKey: ["sub_events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
  });

  const events = subEvents ?? [];

  return (
    <div className="space-y-8">
      <div className="event-card text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{event.name}</h1>
        {event.event_date && <p className="mt-2 text-lg">{formatDate(event.event_date)}</p>}
        {event.event_time && <p className="text-sm opacity-70">{formatTime12(event.event_time)}</p>}
        {event.venue && <p className="mt-2 font-medium">{event.venue}</p>}
        {event.address && <p className="text-sm opacity-70">{event.address}</p>}

        {!countdown.isPast && event.event_date && (
          <div className="mt-6 flex justify-center gap-6">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Mins", value: countdown.minutes },
              { label: "Secs", value: countdown.seconds },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-3xl font-bold">{item.value}</div>
                <div className="text-xs uppercase tracking-wide opacity-70">{item.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(content.section1 || content.welcome || content.home) && (
        <div className="event-card">
          <RichTextContent html={content.section1 || content.welcome || content.home || ""} />
        </div>
      )}
      {content.section2 && <div className="event-card"><RichTextContent html={content.section2} /></div>}
      {content.section3 && <div className="event-card"><RichTextContent html={content.section3} /></div>}

      {events.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Events</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((ev) => (
              <div key={ev.id} className="event-card space-y-1">
                <h3 className="text-lg font-semibold">{ev.name}</h3>
                {ev.date && <p className="text-sm">{formatDate(ev.date)}</p>}
                {ev.time && <p className="text-sm opacity-70">{formatTime12(ev.time)}</p>}
                {ev.venue && <p className="text-sm font-medium">{ev.venue}</p>}
                {ev.address && <p className="text-sm opacity-70">{ev.address}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

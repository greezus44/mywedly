import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type Json } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface ContentConfig {
  story?: string;
  welcome?: string;
}

export default function GuestHomePage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const [countdown, setCountdown] = useState(() => getCountdown(event.event_date));

  // Update countdown every second
  useEffect(() => {
    if (!event.event_date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(event.event_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [event.event_date]);

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["guest-sub-events", event.id],
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

  const content = (event.content as Json | null) as ContentConfig | null;
  const storyHtml = (content?.story as string) || (content?.welcome as string) || "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Countdown */}
      {event.event_date && !countdown.isPast && (
        <section className="event-card mb-8 text-center">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-event-muted">
            Counting down
          </h2>
          <div className="flex justify-center gap-6">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="flex flex-col items-center">
                <span className="text-3xl font-bold text-event-heading">
                  {countdown[unit].toString().padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-wide text-event-muted">
                  {unit}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Welcome / story */}
      {storyHtml && (
        <section className="event-card mb-8">
          <RichTextContent html={storyHtml} />
        </section>
      )}

      {/* Event details */}
      <section className="event-card mb-8 text-center">
        <h2 className="mb-3 text-2xl font-semibold text-event-heading">{event.name}</h2>
        {event.event_date && (
          <p className="text-event-muted">{formatDate(event.event_date)}</p>
        )}
        {event.event_time && (
          <p className="text-event-muted">{formatTime12(event.event_time)}</p>
        )}
        {event.venue && (
          <p className="mt-2 text-event-muted">📍 {event.venue}</p>
        )}
      </section>

      {/* Events list */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-event-heading">Events</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 rounded-full border-2 border-event-primary border-t-transparent" />
          </div>
        ) : subEvents && subEvents.length > 0 ? (
          <div className="space-y-3">
            {subEvents.map((sub) => (
              <div key={sub.id} className="event-card">
                <h3 className="text-lg font-semibold text-event-heading">{sub.name}</h3>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-event-muted">
                  {sub.date && <span>{formatDate(sub.date)}</span>}
                  {sub.start_time && <span>{formatTime12(sub.start_time)}</span>}
                  {sub.venue && <span>📍 {sub.venue}</span>}
                </div>
                {sub.description && (
                  <p className="mt-2 text-sm text-event-text">{sub.description}</p>
                )}
                {sub.dress_code && (
                  <p className="mt-1 text-xs text-event-muted">
                    Dress code: {sub.dress_code}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-event-muted">No additional events listed.</p>
        )}
      </section>
    </div>
  );
}

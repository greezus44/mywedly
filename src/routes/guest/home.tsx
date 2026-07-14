import { useState, useEffect } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

export default function GuestHome() {
  const { event, invitedSubEventIds } = useGuestOutletContext();
  const [countdown, setCountdown] = useState(getCountdown(event.event_date));

  useEffect(() => {
    if (!event.event_date) return;
    const timer = setInterval(() => setCountdown(getCountdown(event.event_date)), 1000);
    return () => clearInterval(timer);
  }, [event.event_date]);

  // Only fetch sub-events the guest is invited to
  const { data: subEvents } = useQuery({
    queryKey: ["guest-invited-sub-events-data", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .in("id", invitedSubEventIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  const content = (event.content ?? {}) as { welcome?: string; story?: string; schedule?: string };

  return (
    <div className="space-y-8">
      {countdown && (
        <div className="event-card text-center">
          <p className="mb-2 text-sm opacity-70">Counting down to {event.name}</p>
          <div className="flex justify-center gap-6 text-3xl font-bold">
            {countdown.days > 0 && <div><span>{countdown.days}</span><span className="ml-1 text-sm font-normal opacity-60">days</span></div>}
            <div><span>{countdown.hours}</span><span className="ml-1 text-sm font-normal opacity-60">hrs</span></div>
            <div><span>{countdown.minutes}</span><span className="ml-1 text-sm font-normal opacity-60">min</span></div>
            <div><span>{countdown.seconds}</span><span className="ml-1 text-sm font-normal opacity-60">sec</span></div>
          </div>
        </div>
      )}

      {content.welcome && (
        <section className="event-card">
          <h2 className="mb-4 text-2xl font-bold">Welcome</h2>
          <RichTextContent html={content.welcome} />
        </section>
      )}

      {content.story && (
        <section className="event-card">
          <h2 className="mb-4 text-2xl font-bold">Our Story</h2>
          <RichTextContent html={content.story} />
        </section>
      )}

      {content.schedule && (
        <section className="event-card">
          <h2 className="mb-4 text-2xl font-bold">Details</h2>
          <RichTextContent html={content.schedule} />
        </section>
      )}

      {subEvents && subEvents.length > 0 && (
        <section className="event-card">
          <h2 className="mb-4 text-2xl font-bold">Events</h2>
          <div className="space-y-3">
            {subEvents.map((sub) => (
              <div key={sub.id} className="rounded-lg border border-event-border p-4">
                <h3 className="text-lg font-semibold">{sub.name}</h3>
                {sub.date && <p className="text-sm opacity-70">{formatDate(sub.date)}</p>}
                {sub.time && <p className="text-sm opacity-70">{formatTime12(sub.time)}</p>}
                {sub.venue && <p className="text-sm opacity-70">{sub.venue}</p>}
                {sub.description && <p className="mt-2 text-sm">{sub.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

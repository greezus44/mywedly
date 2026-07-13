import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

export default function RustyHome() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const [countdown, setCountdown] = useState(getCountdown(event.event_date));

  useEffect(() => {
    if (!event.event_date || countdown.isPast) return;
    const timer = setInterval(() => {
      setCountdown(getCountdown(event.event_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [event.event_date, countdown.isPast]);

  const { data: subEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["guest_sub_events", event.id],
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

  const content = (event.content || {}) as Record<string, any>;

  const countdownItems = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Minutes", value: countdown.minutes },
    { label: "Seconds", value: countdown.seconds },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Event name */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl mb-2" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
          {event.name}
        </h1>
        {event.event_date && (
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>
            {formatDate(event.event_date)}
            {event.event_time && ` • ${formatTime12(event.event_time)}`}
          </p>
        )}
        {event.venue && (
          <p className="text-sm mt-1" style={{ color: "var(--event-muted)" }}>
            {event.venue}
          </p>
        )}
      </div>

      {/* Countdown */}
      {!countdown.isPast && event.event_date && (
        <div className="mb-10">
          <div className="flex justify-center gap-4 md:gap-8">
            {countdownItems.map((item) => (
              <div key={item.label} className="text-center">
                <div
                  className="text-3xl md:text-4xl font-bold tabular-nums"
                  style={{ color: "var(--event-primary)", fontFamily: "var(--event-font-heading)" }}
                >
                  {String(item.value).padStart(2, "0")}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--event-muted)" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rich text content sections */}
      {content.section1 && (
        <div className="mb-6" style={{ color: "var(--event-text)" }}>
          <RichTextContent html={content.section1} />
        </div>
      )}
      {content.section2 && (
        <div className="mb-6" style={{ color: "var(--event-text)" }}>
          <RichTextContent html={content.section2} />
        </div>
      )}
      {content.section3 && (
        <div className="mb-6" style={{ color: "var(--event-text)" }}>
          <RichTextContent html={content.section3} />
        </div>
      )}

      {/* Events list */}
      <div className="mt-12">
        <h2 className="text-2xl mb-6 text-center" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
          Events
        </h2>

        {eventsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 rounded-full" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : subEvents && subEvents.length > 0 ? (
          <div className="space-y-4">
            {subEvents.map((subEvent) => (
              <div
                key={subEvent.id}
                className="rounded-lg p-5"
                style={{
                  backgroundColor: "var(--event-surface)",
                  border: "1px solid var(--event-border)",
                }}
              >
                <h3 className="text-lg mb-2" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
                  {subEvent.name}
                </h3>
                <div className="space-y-1 text-sm" style={{ color: "var(--event-text)" }}>
                  {subEvent.date && (
                    <p>
                      <span style={{ color: "var(--event-muted)" }}>Date:</span>{" "}
                      {formatDate(subEvent.date)}
                      {subEvent.start_time && ` at ${formatTime12(subEvent.start_time)}`}
                    </p>
                  )}
                  {subEvent.venue && (
                    <p>
                      <span style={{ color: "var(--event-muted)" }}>Venue:</span> {subEvent.venue}
                    </p>
                  )}
                  {subEvent.address && (
                    <p>
                      <span style={{ color: "var(--event-muted)" }}>Address:</span> {subEvent.address}
                    </p>
                  )}
                  {subEvent.description && (
                    <p className="mt-2" style={{ color: "var(--event-text)" }}>
                      {subEvent.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>
            No events listed yet.
          </p>
        )}
      </div>
    </div>
  );
}

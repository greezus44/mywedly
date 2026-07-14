import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SubEvent, type Json } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { RichTextContent } from "../../lib/sanitize";
import {
  formatDate,
  formatTime12,
  getCountdown,
  to12Hour,
} from "../../lib/utils";

export default function Home() {
  const { event, slug } = useGuestOutletContext();
  const [countdown, setCountdown] = useState(() =>
    getCountdown(event.event_date)
  );

  // Update countdown every second
  useEffect(() => {
    if (!event.event_date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(event.event_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [event.event_date]);

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["guest_sub_events", event.id],
    enabled: !!event.id,
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

  const content = event.content as Record<string, unknown> | null;
  const introHtml =
    content && typeof content === "object" && "intro" in content
      ? (content.intro as string)
      : "";

  return (
    <div className="flex flex-col gap-8">
      {/* Cover hero */}
      {event.cover_image && (
        <div className="relative h-64 overflow-hidden rounded-lg">
          <img
            src={event.cover_image}
            alt={event.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Title & date */}
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold text-event-heading">
          {event.name}
        </h1>
        {event.event_type && (
          <p className="mb-4 text-sm uppercase tracking-widest text-event-muted">
            {event.event_type}
          </p>
        )}
        <div className="space-y-1">
          {event.event_date && (
            <p className="text-event-text">
              {formatDate(event.event_date)}
              {event.event_time && ` at ${to12Hour(event.event_time)}`}
            </p>
          )}
          {event.venue && <p className="text-event-text">{event.venue}</p>}
          {event.address && (
            <p className="text-sm text-event-muted">{event.address}</p>
          )}
        </div>
      </div>

      {/* Countdown */}
      {event.event_date && !countdown.isPast && (
        <div className="flex justify-center gap-6">
          {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
            <div key={unit} className="text-center">
              <div className="text-3xl font-bold text-event-heading">
                {countdown[unit]}
              </div>
              <div className="text-xs uppercase text-event-muted">{unit}</div>
            </div>
          ))}
        </div>
      )}

      {/* Rich text content */}
      {introHtml && (
        <div className="mx-auto max-w-2xl">
          <RichTextContent html={introHtml} />
        </div>
      )}

      {/* Events list */}
      <div>
        <h2 className="mb-4 text-2xl font-bold text-event-heading">Events</h2>
        {isLoading ? (
          <div className="animate-pulse text-event-muted">Loading events…</div>
        ) : !subEvents || subEvents.length === 0 ? (
          <p className="text-sm text-event-muted">
            No additional events have been scheduled.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {subEvents.map((se) => (
              <div
                key={se.id}
                className="event-card flex flex-col gap-1"
              >
                <h3 className="text-lg font-semibold text-event-heading">
                  {se.name}
                </h3>
                {se.description && (
                  <p className="text-sm text-event-muted">{se.description}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-event-text">
                  {se.date && <span>{formatDate(se.date)}</span>}
                  {se.start_time && (
                    <span>{formatTime12(se.start_time)}</span>
                  )}
                  {se.venue && <span>📍 {se.venue}</span>}
                </div>
                {se.dress_code && (
                  <p className="text-xs text-event-muted">
                    Dress code: {se.dress_code}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

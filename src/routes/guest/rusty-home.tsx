import React, { useState, useEffect } from "react";
import { useOutletContext, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface HomeContent {
  welcomeTitle?: string;
  welcomeBody?: string;
  storyTitle?: string;
  storyBody?: string;
  detailsTitle?: string;
  detailsBody?: string;
}

const DEFAULT_CONTENT: HomeContent = {
  welcomeTitle: "Welcome",
  welcomeBody: "<p>We're so glad you're here. Explore the details of our special day below.</p>",
  storyTitle: "Our Story",
  storyBody: "<p>Read about how we met and fell in love.</p>",
  detailsTitle: "When & Where",
  detailsBody: "<p>Find all the details about our venue and schedule here.</p>",
};

function Countdown({ targetDate }: { targetDate: string | null }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const countdown = getCountdown(targetDate);

  if (countdown.isPast) {
    return (
      <p className="text-center text-lg" style={{ color: "var(--event-muted)" }}>
        The day has arrived!
      </p>
    );
  }

  const items = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Minutes", value: countdown.minutes },
    { label: "Seconds", value: countdown.seconds },
  ];

  return (
    <div className="mt-8 flex justify-center gap-4">
      {items.map((item) => (
        <div key={item.label} className="event-card text-center" style={{ minWidth: 80 }}>
          <div className="text-2xl font-bold" style={{ color: "var(--event-primary)" }}>
            {item.value}
          </div>
          <div className="text-xs uppercase" style={{ color: "var(--event-muted)" }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RustyHome() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { slug } = useParams<{ slug: string }>();

  const content = (event.content ?? DEFAULT_CONTENT) as unknown as HomeContent;

  const { data: subEvents } = useQuery({
    queryKey: ["guest-sub-events", event.id],
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

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Welcome */}
        <h2 className="text-center text-3xl font-bold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
          {content.welcomeTitle ?? "Welcome"}
        </h2>
        <RichTextContent html={content.welcomeBody ?? ""} className="mt-4 text-center" />

        {/* Countdown */}
        <Countdown targetDate={event.event_date} />

        {/* When & Where */}
        <div className="mt-8 event-card">
          <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
            {content.detailsTitle ?? "When & Where"}
          </h3>
          <RichTextContent html={content.detailsBody ?? ""} className="mt-2" />
          <div className="mt-3 text-sm" style={{ color: "var(--event-text)" }}>
            <p>
              {formatDate(event.event_date)}
              {event.event_time ? ` at ${formatTime12(event.event_time)}` : ""}
            </p>
            {event.venue && <p className="mt-1">{event.venue}</p>}
            {event.address && (
              <p className="mt-1" style={{ color: "var(--event-muted)" }}>{event.address}</p>
            )}
          </div>
        </div>

        {/* Our Story */}
        {(content.storyBody || content.storyTitle) && (
          <div className="mt-6 event-card">
            <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
              {content.storyTitle ?? "Our Story"}
            </h3>
            <RichTextContent html={content.storyBody ?? ""} className="mt-2" />
          </div>
        )}

        {/* Events */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-center" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
            Events
          </h3>
          {!subEvents || subEvents.length === 0 ? (
            <p className="mt-4 text-center text-sm" style={{ color: "var(--event-muted)" }}>
              No events listed yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {subEvents.map((se) => (
                <div key={se.id} className="event-card">
                  <h4 className="font-semibold" style={{ color: "var(--event-heading)" }}>
                    {se.name}
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm" style={{ color: "var(--event-muted)" }}>
                    {se.date && <span>📅 {formatDate(se.date)}</span>}
                    {se.start_time && <span>🕐 {formatTime12(se.start_time)}</span>}
                    {se.venue && <span>📍 {se.venue}</span>}
                  </div>
                  {se.description && (
                    <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>
                      {se.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={`/r/${slug}/rsvp`} className="event-btn-primary">RSVP Now</Link>
          <Link to={`/r/${slug}/wishes`} className="event-btn-secondary">Leave a Wish</Link>
        </div>
      </div>
    </div>
  );
}

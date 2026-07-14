import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown, formatDate, formatTime12, cn } from "../../lib/utils";

export default function Home(): React.ReactElement {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const [countdown, setCountdown] = useState(getCountdown(event.event_date));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(event.event_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [event.event_date]);

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

  const content = (event.content as Record<string, unknown> | null) ?? {};
  const introHtml = (content.intro as string) || "";
  const storyHtml = (content.story as string) || "";

  const visibleSubEvents = (subEvents ?? []).filter(
    (s) => invitedSubEventIds.length === 0 || invitedSubEventIds.includes(s.id),
  );

  const baseLink = `/e/${slug}`;

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6 text-center">
        {event.cover_image && (
          <img
            src={event.cover_image}
            alt={event.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 animate-fadeIn">
          <p className="guest-eyebrow text-white/70">{event.event_type || "Invitation"}</p>
          <h1
            className="mt-4 text-4xl font-bold text-white drop-shadow-lg md:text-6xl"
            style={{ fontFamily: "var(--event-font-heading)" }}
          >
            {event.name}
          </h1>
          {event.venue && (
            <p className="mt-4 text-lg text-white/80">{event.venue}</p>
          )}
        </div>
      </section>

      {/* Countdown */}
      {!countdown.isPast && event.event_date && (
        <section className="guest-section text-center animate-fadeIn">
          <p className="guest-eyebrow">Counting Down</p>
          <div className="mt-8 flex items-center justify-center gap-4 md:gap-10">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit, i) => (
              <div key={unit} className="text-center" style={{ animationDelay: `${i * 0.1}s` }}>
                <div
                  className="text-5xl font-bold md:text-7xl"
                  style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}
                >
                  {countdown[unit]}
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-event-muted">
                  {unit}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Welcome / Intro */}
      {introHtml && (
        <section className="guest-section text-center">
          <div className="mx-auto max-w-2xl animate-slideUp">
            <p className="guest-eyebrow">Welcome</p>
            <RichTextContent html={introHtml} className="mt-4" />
          </div>
        </section>
      )}

      {/* Story */}
      {storyHtml && (
        <section className="guest-section text-center">
          <div className="mx-auto max-w-2xl animate-slideUp">
            <p className="guest-eyebrow">Our Story</p>
            <RichTextContent html={storyHtml} className="mt-4" />
          </div>
        </section>
      )}

      {/* Details */}
      <section className="guest-section">
        <div className="mx-auto max-w-3xl text-center animate-slideUp">
          <p className="guest-eyebrow">Details</p>
          <h2 className="guest-title">When & Where</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="event-info-card">
              <p className="guest-eyebrow">Date</p>
              <p className="mt-2 text-lg text-event-text">
                {event.event_date ? formatDate(event.event_date) : "TBD"}
              </p>
              {event.event_time && (
                <p className="mt-1 text-sm text-event-muted">{formatTime12(event.event_time)}</p>
              )}
            </div>
            <div className="event-info-card">
              <p className="guest-eyebrow">Venue</p>
              <p className="mt-2 text-lg text-event-text">{event.venue || "TBD"}</p>
              {event.address && (
                <p className="mt-1 text-sm text-event-muted">{event.address}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Events */}
      {visibleSubEvents.length > 0 && (
        <section className="guest-section">
          <div className="mx-auto max-w-4xl text-center">
            <p className="guest-eyebrow">Events</p>
            <h2 className="guest-title">The Celebration</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {visibleSubEvents.map((sub, i) => (
                <Link
                  key={sub.id}
                  to={`${baseLink}/rsvp`}
                  className="event-card event-card-hover text-left animate-slideUpStagger"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <p className="guest-eyebrow">{sub.date ? formatDate(sub.date) : ""}</p>
                  <h3 className="mt-1 text-xl font-semibold text-event-heading">{sub.name}</h3>
                  {sub.venue && (
                    <p className="mt-2 text-sm text-event-muted">{sub.venue}</p>
                  )}
                  {sub.start_time && (
                    <p className="mt-1 text-sm text-event-muted">{formatTime12(sub.start_time)}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="guest-section text-center">
        <Link to={`${baseLink}/rsvp`} className="event-btn-primary inline-block">
          RSVP Now
        </Link>
      </section>
    </div>
  );
}

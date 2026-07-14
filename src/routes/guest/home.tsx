import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { resolveTypography } from "../../lib/typography";
import { getCountdown, formatDate, formatTime12 } from "../../lib/utils";

interface HomeContent {
  welcomeHeading?: unknown;
  welcomeBody?: unknown;
  storyHeading?: unknown;
  storyBody?: unknown;
  rsvpHeading?: unknown;
  rsvpBody?: unknown;
}

export default function GuestHome() {
  const { event, slug, theme, invitedSubEventIds } = useGuestOutletContext();
  const content = (event.content ?? {}) as HomeContent;

  // Countdown ticker
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!event.event_date) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [event.event_date]);

  const cd = getCountdown(event.event_date);

  // Invited sub-events
  const { data: subEvents = [] } = useQuery({
    queryKey: ["guest-sub-events", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("event_id", event.id)
        .in("id", invitedSubEventIds)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  const welcome = resolveTypography(content.welcomeHeading, "Welcome");
  const welcomeBody = resolveTypography(content.welcomeBody, "We can't wait to share our special day with you.");
  const story = resolveTypography(content.storyHeading, "Our Story");
  const storyBody = resolveTypography(content.storyBody);
  const rsvpHeading = resolveTypography(content.rsvpHeading, "RSVP");
  const rsvpBody = resolveTypography(content.rsvpBody, "Will you be joining us?");

  const cdItems = [
    { label: "Days", value: cd.days },
    { label: "Hours", value: cd.hours },
    { label: "Minutes", value: cd.minutes },
    { label: "Seconds", value: cd.seconds },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="guest-section flex flex-col items-center justify-center text-center" style={{ paddingTop: "6rem", paddingBottom: "5rem" }}>
        <div className="animate-fadeIn">
          <p className="guest-eyebrow">{event.title || "We're getting married"}</p>
          <h1 className="guest-title" style={{ fontSize: "calc(3.5rem * var(--event-font-scale, 1))", marginBottom: "1.5rem" }}>
            {event.title || "Our Wedding"}
          </h1>
          {event.description && (
            <p className="guest-subtitle mx-auto" style={{ maxWidth: "32rem" }}>{event.description}</p>
          )}
        </div>
      </section>

      {/* Countdown */}
      {event.event_date && !cd.isPast && (
        <section className="guest-section-tight flex flex-col items-center text-center">
          <p className="guest-eyebrow">Counting Down</p>
          <div className="flex justify-center gap-4 md:gap-8 mt-4">
            {cdItems.map((it) => (
              <div
                key={it.label}
                className="event-card text-center"
                style={{ padding: "1.5rem 1.25rem", minWidth: "5rem" }}
              >
                <div style={{ fontSize: "calc(2.5rem * var(--event-font-scale, 1))", fontWeight: 700, color: theme.primary, fontFamily: theme.fontHeading, lineHeight: 1 }}>
                  {String(it.value).padStart(2, "0")}
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
                  {it.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Welcome */}
      <section className="guest-section flex flex-col items-center text-center">
        <p className="guest-eyebrow">Welcome</p>
        <h2 className="guest-title" style={welcome.style}>{welcome.text}</h2>
        <p className="guest-subtitle mx-auto" style={{ ...welcomeBody.style, maxWidth: "40rem" }}>{welcomeBody.text}</p>
      </section>

      {/* Story */}
      {(story.text || storyBody.text) && (
        <section className="guest-section flex flex-col items-center text-center">
          {story.text && <p className="guest-eyebrow">Our Story</p>}
          {story.text && <h2 className="guest-title" style={story.style}>{story.text}</h2>}
          {storyBody.text && (
            <p className="guest-subtitle mx-auto" style={{ ...storyBody.style, maxWidth: "40rem", whiteSpace: "pre-wrap" }}>{storyBody.text}</p>
          )}
        </section>
      )}

      {/* Details */}
      <section className="guest-section-tight">
        <div className="mx-auto max-w-3xl">
          <p className="guest-eyebrow text-center">The Details</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="event-card text-center">
              <h3 className="mb-2" style={{ color: theme.heading, fontFamily: theme.fontHeading, fontSize: "1.25rem" }}>When</h3>
              <p style={{ color: theme.text }}>{formatDate(event.event_date)}</p>
              {event.event_end_date && (
                <p className="mt-1 text-sm" style={{ color: theme.muted }}>until {formatDate(event.event_end_date)}</p>
              )}
            </div>
            <div className="event-card text-center">
              <h3 className="mb-2" style={{ color: theme.heading, fontFamily: theme.fontHeading, fontSize: "1.25rem" }}>Where</h3>
              <p style={{ color: theme.text }}>{event.venue_name || "Venue TBA"}</p>
              {event.venue_address && (
                <p className="mt-1 text-sm" style={{ color: theme.muted }}>{event.venue_address}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Events */}
      {subEvents.length > 0 && (
        <section className="guest-section">
          <div className="mx-auto max-w-4xl">
            <p className="guest-eyebrow text-center">Events</p>
            <h2 className="guest-title text-center">The Schedule</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {subEvents.map((se, i) => (
                <div
                  key={se.id}
                  className="event-card event-card-hover animate-slideUpStagger"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <h3 className="mb-2" style={{ color: theme.heading, fontFamily: theme.fontHeading, fontSize: "1.5rem" }}>{se.name}</h3>
                  {se.start_time && (
                    <p className="text-sm" style={{ color: theme.primary }}>{formatTime12(se.start_time)}</p>
                  )}
                  {se.venue_name && (
                    <p className="mt-1 text-sm" style={{ color: theme.muted }}>{se.venue_name}</p>
                  )}
                  {se.description && (
                    <p className="mt-3 text-sm" style={{ color: theme.text }}>{se.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP CTA */}
      <section className="guest-section flex flex-col items-center text-center">
        <p className="guest-eyebrow">{rsvpHeading.text || "RSVP"}</p>
        <h2 className="guest-title" style={rsvpHeading.style}>{rsvpHeading.text || "Will you join us?"}</h2>
        <p className="guest-subtitle mx-auto" style={rsvpBody.style}>{rsvpBody.text}</p>
        <Link to={`/e/${slug}/rsvp`} className="event-btn-primary mt-6 inline-block">Respond Now</Link>
      </section>
    </div>
  );
}

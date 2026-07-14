import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { getCountdown, formatDate, formatTime12, cn } from "../../lib/utils";
import { RichTextContent } from "../../lib/sanitize";

export default function GuestHome() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const [countdown, setCountdown] = useState(() => getCountdown(event.event_date));

  useEffect(() => {
    if (!event.event_date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(event.event_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [event.event_date]);

  // Fetch invited sub-events
  const { data: subEvents = [], isLoading } = useQuery({
    queryKey: ["guest-home-sub-events", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .in("id", invitedSubEventIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  const content = (event.content ?? {}) as {
    welcomeText?: string;
    storyTitle?: string;
    storyBody?: string;
  };

  const heroImage = event.cover_image;

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        {heroImage ? (
          <>
            <img src={heroImage} alt={event.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,0.35)` }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, var(--event-primary), var(--event-accent))` }} />
        )}
        <div className="relative z-10 px-6 text-center" style={{ color: "#fff" }}>
          <p className="guest-eyebrow" style={{ color: "rgba(255,255,255,0.8)" }}>
            {event.event_type || "You're Invited"}
          </p>
          <h1 className="text-4xl font-bold md:text-6xl" style={{ fontFamily: "var(--event-font-heading)" }}>
            {event.name}
          </h1>
          {event.event_date && (
            <p className="mt-4 text-lg" style={{ color: "rgba(255,255,255,0.9)" }}>
              {formatDate(event.event_date)}
              {event.event_time && ` · ${formatTime12(event.event_time)}`}
            </p>
          )}
          {event.venue && (
            <p className="mt-1 text-base" style={{ color: "rgba(255,255,255,0.8)" }}>
              {event.venue}
            </p>
          )}
        </div>
      </section>

      {/* Countdown */}
      {event.event_date && !countdown.isPast && (
        <section className="guest-section text-center">
          <p className="guest-eyebrow">Counting Down</p>
          <div className="mt-6 flex justify-center gap-6 md:gap-12">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <span className="text-4xl font-bold md:text-6xl" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="mt-2 text-xs uppercase tracking-widest" style={{ color: "var(--event-muted)" }}>
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Welcome */}
      <section className="guest-section text-center" style={{ backgroundColor: "var(--event-surface)" }}>
        <p className="guest-eyebrow">Welcome</p>
        <h2 className="guest-title">We're Glad You're Here</h2>
        <p className="guest-subtitle mx-auto">
          {content.welcomeText || "We invite you to celebrate this special occasion with us. Explore the details below and let us know if you can make it."}
        </p>
      </section>

      {/* Story */}
      {content.storyBody && (
        <section className="guest-section text-center">
          <p className="guest-eyebrow">{content.storyTitle || "Our Story"}</p>
          <div className="mx-auto max-w-2xl text-left">
            <RichTextContent html={content.storyBody} className="rich-content" />
          </div>
        </section>
      )}

      {/* Details */}
      {(event.event_date || event.venue || event.address) && (
        <section className="guest-section" style={{ backgroundColor: "var(--event-surface)" }}>
          <div className="text-center">
            <p className="guest-eyebrow">The Details</p>
            <h2 className="guest-title">When & Where</h2>
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl gap-6 md:grid-cols-2">
            <div className="event-info-card text-center">
              <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--event-heading)" }}>Date & Time</h3>
              <p style={{ color: "var(--event-text)" }}>
                {event.event_date ? formatDate(event.event_date) : "TBD"}
              </p>
              <p style={{ color: "var(--event-muted)" }}>
                {event.event_time ? formatTime12(event.event_time) : ""}
              </p>
            </div>
            <div className="event-info-card text-center">
              <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--event-heading)" }}>Venue</h3>
              <p style={{ color: "var(--event-text)" }}>{event.venue || "TBD"}</p>
              {event.address && (
                <p className="text-sm" style={{ color: "var(--event-muted)" }}>{event.address}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Events */}
      <section className="guest-section">
        <div className="text-center">
          <p className="guest-eyebrow">Schedule of Events</p>
          <h2 className="guest-title">Events</h2>
          <p className="guest-subtitle mx-auto">Here are the events you're invited to.</p>
        </div>
        {isLoading ? (
          <div className="mt-8 text-center" style={{ color: "var(--event-muted)" }}>Loading events…</div>
        ) : subEvents.length > 0 ? (
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {subEvents.map((sub, i) => (
              <div
                key={sub.id}
                className="event-info-card animate-slideUpStagger"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <h3 className="mb-2 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>
                  {sub.name}
                </h3>
                {sub.date && (
                  <p className="mb-1" style={{ color: "var(--event-text)" }}>
                    {formatDate(sub.date)}
                  </p>
                )}
                {sub.start_time && (
                  <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                    {formatTime12(sub.start_time)}
                    {sub.end_time ? ` – ${formatTime12(sub.end_time)}` : ""}
                  </p>
                )}
                {sub.venue && (
                  <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>{sub.venue}</p>
                )}
                {sub.description && (
                  <p className="mt-3 text-sm" style={{ color: "var(--event-text)" }}>{sub.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center">
            <Link to={`/e/${slug}/rsvp`} className="event-btn-primary inline-block">
              Respond to RSVP
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

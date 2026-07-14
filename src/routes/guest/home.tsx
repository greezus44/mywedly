import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";
import { getCountdown, formatDate, formatTime12 } from "../../lib/utils";

export default function GuestHome() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const [countdown, setCountdown] = useState(getCountdown(event.event_date));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown(event.event_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [event.event_date]);

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["guest-home-sub-events", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .in("id", invitedSubEventIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  const content = (event.content ?? {}) as {
    welcomeTitle?: string;
    welcomeBody?: string;
    storyTitle?: string;
    storyBody?: string;
    storyImage?: string;
    heroImage?: string;
  };

  const events = subEvents ?? [];
  const heroImage = content.heroImage || event.cover_image;

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 text-center">
        {heroImage && (
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} />
          </div>
        )}
        <div className="relative z-10 max-w-2xl animate-fadeIn">
          <p className="guest-eyebrow" style={{ color: heroImage ? "#fff" : undefined }}>
            {event.event_type || "We invite you"}
          </p>
          <h1
            className="guest-title mb-3"
            style={{ fontSize: "calc(3rem * var(--event-font-scale, 1))", color: heroImage ? "#fff" : undefined }}
          >
            {event.name}
          </h1>
          {guest && (
            <p
              className="guest-subtitle mx-auto"
              style={{ color: heroImage ? "rgba(255,255,255,0.9)" : undefined }}
            >
              Welcome, {guest.name}
            </p>
          )}
        </div>
      </section>

      {/* Countdown */}
      {!countdown.expired && event.event_date && (
        <section className="guest-section text-center">
          <p className="guest-eyebrow">Counting Down</p>
          <div className="mx-auto mt-6 flex max-w-2xl justify-center gap-6 md:gap-12">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <span
                  className="font-bold tabular-nums"
                  style={{
                    fontSize: "calc(2.5rem * var(--event-font-scale, 1))",
                    color: "var(--event-heading)",
                    fontFamily: "var(--event-font-heading)",
                  }}
                >
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--event-muted)" }}>
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Welcome */}
      {(content.welcomeTitle || content.welcomeBody) && (
        <section className="guest-section text-center" style={{ paddingTop: 0 }}>
          <div className="mx-auto max-w-2xl animate-slideUp">
            {content.welcomeTitle && <h2 className="guest-title mb-4">{content.welcomeTitle}</h2>}
            {content.welcomeBody && (
              <p className="guest-subtitle mx-auto rich-content">{content.welcomeBody}</p>
            )}
          </div>
        </section>
      )}

      {/* Story */}
      {(content.storyTitle || content.storyBody || content.storyImage) && (
        <section className="guest-section" style={{ paddingTop: 0 }}>
          <div className="mx-auto max-w-4xl">
            <div className="grid items-center gap-8 md:grid-cols-2">
              {content.storyImage && (
                <div className="animate-slideUp">
                  <img
                    src={content.storyImage}
                    alt="Our story"
                    className="w-full rounded-2xl object-cover shadow-lg"
                    style={{ borderRadius: "var(--event-radius)" }}
                  />
                </div>
              )}
              <div className="animate-slideUp" style={{ animationDelay: "100ms" }}>
                <p className="guest-eyebrow">Our Story</p>
                {content.storyTitle && <h2 className="guest-title mb-4">{content.storyTitle}</h2>}
                {content.storyBody && (
                  <p className="guest-subtitle rich-content">{content.storyBody}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Event Details */}
      {(event.event_date || event.venue || event.address) && (
        <section className="guest-section text-center" style={{ paddingTop: 0 }}>
          <p className="guest-eyebrow">The Details</p>
          <h2 className="guest-title mb-6">When & Where</h2>
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            {event.event_date && (
              <div className="event-card text-center">
                <p className="guest-eyebrow">Date</p>
                <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                  {formatDate(event.event_date)}
                </p>
                {event.event_time && (
                  <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>
                    {formatTime12(event.event_time)}
                  </p>
                )}
              </div>
            )}
            {(event.venue || event.address) && (
              <div className="event-card text-center">
                <p className="guest-eyebrow">Venue</p>
                {event.venue && (
                  <p className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
                    {event.venue}
                  </p>
                )}
                {event.address && (
                  <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>{event.address}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Events */}
      {invitedSubEventIds.length > 0 && (
        <section className="guest-section" style={{ paddingTop: 0 }}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <p className="guest-eyebrow">Schedule</p>
              <h2 className="guest-title">Events</h2>
            </div>
            {isLoading ? (
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
              </div>
            ) : events.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {events.map((subEvent, index) => (
                  <div
                    key={subEvent.id}
                    className="event-card event-card-hover animate-slideUpStagger"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <h3 className="mb-2 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>
                      {subEvent.name}
                    </h3>
                    {subEvent.date && (
                      <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                        {formatDate(subEvent.date)}
                        {subEvent.start_time ? ` at ${formatTime12(subEvent.start_time)}` : ""}
                      </p>
                    )}
                    {subEvent.venue && (
                      <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>{subEvent.venue}</p>
                    )}
                    {subEvent.description && (
                      <p className="mt-3 text-sm" style={{ color: "var(--event-text)" }}>
                        {subEvent.description}
                      </p>
                    )}
                    <div className="mt-4">
                      <Link to={`/e/${slug}/rsvp`} className="event-btn-secondary text-xs">
                        RSVP
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>
                No events available.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

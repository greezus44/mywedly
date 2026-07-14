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
  const logoConfig = (event.logo_config ?? {}) as { url?: string };

  return (
    <div>
      {/* Hero section */}
      <section className="guest-section flex flex-col items-center justify-center text-center">
        {logoConfig.url && <img src={logoConfig.url} alt="Logo" className="mb-6 h-12 w-auto opacity-80" />}
        <p className="guest-eyebrow">{event.event_type || "Invitation"}</p>
        <h1 className="guest-title">{event.name}</h1>
        {event.event_date && (
          <p className="text-lg opacity-80" style={{ color: "var(--event-muted)" }}>
            {formatDate(event.event_date)}
          </p>
        )}
        {event.venue && (
          <p className="text-base opacity-60" style={{ color: "var(--event-muted)" }}>
            {event.venue}
          </p>
        )}
      </section>

      {/* Countdown */}
      {countdown && (
        <section className="guest-section-tight text-center animate-fadeIn">
          <p className="guest-eyebrow">Counting Down</p>
          <div className="flex justify-center gap-4 md:gap-8">
            {countdown.days > 0 && (
              <CountdownUnit value={countdown.days} label="Days" />
            )}
            <CountdownUnit value={countdown.hours} label="Hours" />
            <CountdownUnit value={countdown.minutes} label="Minutes" />
            <CountdownUnit value={countdown.seconds} label="Seconds" />
          </div>
        </section>
      )}

      {/* Welcome message */}
      {content.welcome && (
        <section className="guest-section animate-slideUp">
          <div className="mx-auto max-w-2xl text-center">
            <p className="guest-eyebrow">Welcome</p>
            <RichTextContent html={content.welcome} />
          </div>
        </section>
      )}

      {/* Our Story */}
      {content.story && (
        <section className="guest-section animate-slideUp">
          <div className="mx-auto max-w-2xl">
            <p className="guest-eyebrow text-center">Our Story</p>
            <RichTextContent html={content.story} />
          </div>
        </section>
      )}

      {/* Event details */}
      {content.schedule && (
        <section className="guest-section animate-slideUp">
          <div className="mx-auto max-w-2xl">
            <p className="guest-eyebrow text-center">Details</p>
            <RichTextContent html={content.schedule} />
          </div>
        </section>
      )}

      {/* Events list */}
      {subEvents && subEvents.length > 0 && (
        <section className="guest-section">
          <div className="mb-8 text-center">
            <p className="guest-eyebrow">Events</p>
            <h2 className="guest-title">Celebration Schedule</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {subEvents.map((sub, i) => (
              <div
                key={sub.id}
                className="event-info-card animate-slideUpStagger"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <h3 className="mb-2 text-xl font-semibold">{sub.name}</h3>
                {sub.date && (
                  <p className="mb-1 text-sm" style={{ color: "var(--event-muted)" }}>
                    {formatDate(sub.date)}
                  </p>
                )}
                {sub.time && (
                  <p className="mb-1 text-sm" style={{ color: "var(--event-muted)" }}>
                    {formatTime12(sub.time)}
                  </p>
                )}
                {sub.venue && (
                  <p className="mb-1 text-sm" style={{ color: "var(--event-muted)" }}>
                    {sub.venue}
                  </p>
                )}
                {sub.description && (
                  <p className="mt-3 text-sm leading-relaxed">{sub.description}</p>
                )}
                {sub.dress_code && (
                  <p className="mt-2 text-xs" style={{ color: "var(--event-muted)" }}>
                    Dress code: {sub.dress_code}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-bold md:text-5xl" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-xs uppercase tracking-widest opacity-60" style={{ color: "var(--event-muted)" }}>
        {label}
      </span>
    </div>
  );
}

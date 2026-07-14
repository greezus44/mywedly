import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type Json } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { LoadingSpinner, ErrorState } from "../../components/ui";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface HomeContent {
  section1?: string;
  section2?: string;
  section3?: string;
}

function jsonToContent(json: Json | null | undefined): HomeContent {
  if (!json || typeof json !== "object") return {};
  return json as HomeContent;
}

export default function Home() {
  const { slug } = useParams<{ slug: string }>();
  const [countdown, setCountdown] = useState(() =>
    getCountdown(null)
  );

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["guest-sub-events", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event!.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!event?.id,
  });

  // Countdown updates every second
  useEffect(() => {
    if (!event?.event_date) return;
    const target = `${event.event_date}T${event.event_time ?? "00:00:00"}`;
    setCountdown(getCountdown(target));
    const interval = setInterval(() => {
      setCountdown(getCountdown(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [event?.event_date, event?.event_time]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !event) {
    return <ErrorState title="This invitation website could not be found or is no longer available." />;
  }

  const content = jsonToContent(event.content);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="text-center">
        <h1
          className="text-3xl font-bold text-event-heading md:text-4xl"
          style={{ fontFamily: "var(--event-font-heading)" }}
        >
          {event.name}
        </h1>
        {event.event_date && (
          <p className="mt-2 text-sm text-event-muted">
            {formatDate(event.event_date)}
            {event.event_time ? ` at ${formatTime12(event.event_time)}` : ""}
          </p>
        )}
      </header>

      {/* Countdown */}
      {!countdown.done && (
        <section className="flex items-center justify-center gap-4 rounded-lg bg-event-surface-alt p-6">
          {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
            <div key={unit} className="flex flex-col items-center">
              <span className="text-3xl font-bold text-event-primary">
                {String(countdown[unit]).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase text-event-muted">{unit}</span>
            </div>
          ))}
        </section>
      )}

      {/* Rich text content sections */}
      {content.section1 && (
        <section className="rich-content">
          <RichTextContent html={content.section1} className="text-event-text" />
        </section>
      )}
      {content.section2 && (
        <section className="rich-content">
          <RichTextContent html={content.section2} className="text-event-text" />
        </section>
      )}
      {content.section3 && (
        <section className="rich-content">
          <RichTextContent html={content.section3} className="text-event-text" />
        </section>
      )}

      {/* Events list */}
      {subEvents && subEvents.length > 0 && (
        <section>
          <h2
            className="mb-4 text-center text-2xl font-semibold text-event-heading"
            style={{ fontFamily: "var(--event-font-heading)" }}
          >
            Events
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {subEvents.map((sub) => (
              <div key={sub.id} className="event-card">
                <h3 className="text-lg font-semibold text-event-heading">{sub.name}</h3>
                {sub.description && (
                  <p className="mt-1 text-sm text-event-muted">{sub.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-event-muted">
                  {sub.date && <span>📅 {formatDate(sub.date)}</span>}
                  {sub.time && <span>⏰ {formatTime12(sub.time)}</span>}
                  {sub.venue && <span>📍 {sub.venue}</span>}
                  {sub.dress_code && <span>👔 {sub.dress_code}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

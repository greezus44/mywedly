import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";

export default function GuestHome() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: event } = useQuery({
    queryKey: ["event_by_slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!slug,
  });

  if (!event) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  const content = (event.content ?? {}) as Record<string, unknown>;
  const bodyHtml = (content.body as string) || "";
  const logoConfig = (event.logo_config ?? {}) as Record<string, unknown>;

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Logo */}
      {typeof logoConfig.imageUrl === "string" && logoConfig.imageUrl && (
        <div className="text-center pt-6 pb-3">
          <img src={logoConfig.imageUrl} alt="Logo" className="mx-auto max-h-20 object-contain" />
        </div>
      )}

      {/* Body content */}
      {bodyHtml && (
        <div
          className="prose prose-sm max-w-none text-[var(--event-text)]"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}

      {/* RSVP section */}
      <div className="rsvp-section text-center py-6 mt-4 rounded-lg">
        <h2 className="text-xl font-semibold text-[var(--event-text)] mb-2" style={{ fontFamily: "var(--event-heading-font)" }}>
          {event.event_date && formatDate(event.event_date)}
        </h2>
        {event.event_time && (
          <p className="text-sm text-[var(--event-text-muted)] mb-3">{formatTime(event.event_time)}</p>
        )}
        {event.venue && (
          <p className="text-sm text-[var(--event-text-muted)] mb-3">{event.venue}</p>
        )}
        <button
          onClick={() => navigate(`/e/${slug}/rsvp`)}
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: "var(--event-primary)", color: "#fff", borderRadius: "var(--event-button-radius)" }}
        >
          RSVP Now
        </button>
      </div>
    </div>
  );
}

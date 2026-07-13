import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { Calendar, Clock, MapPin, MessageSquare } from "lucide-react";
import type { GuestLayoutContext } from "./guest-layout";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { formatDate, formatTime, isRsvpClosed } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

export default function GuestHome() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const outletCtx = useOutletContext<GuestLayoutContext | null>();
  const { data: queriedEvent } = useQuery<UserEvent>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId && !outletCtx?.event,
  });
  const event = outletCtx?.event || queriedEvent;

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-lg text-slate-400">Loading...</div>
      </div>
    );
  }

  const theme = event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  const content = event.content || {};
  const rsvpClosed = isRsvpClosed(event.rsvp_deadline);

  return (
    <div
      style={{ ...cssVars, backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}
      className="min-h-screen px-4 py-8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          {content.invitation_title && (
            <p className="text-sm uppercase tracking-[0.2em] mb-2" style={{ color: "var(--color-accent)", fontFamily: "var(--font-body)" }}>
              {content.invitation_title}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-medium mb-3" style={{ fontFamily: "var(--font-script)" }}>
            {event.name}
          </h1>
          {content.invitation_subtitle && (
            <p className="text-base opacity-80" style={{ fontFamily: "var(--font-script)" }}>
              {content.invitation_subtitle}
            </p>
          )}
        </div>

        <div className="space-y-4 mb-10">
          {event.event_date && (
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
              <div>
                <p className="text-xs uppercase tracking-wider opacity-60 mb-0.5">Date</p>
                <p className="text-base font-medium">{formatDate(event.event_date)}</p>
              </div>
            </div>
          )}
          {event.event_time && (
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
              <div>
                <p className="text-xs uppercase tracking-wider opacity-60 mb-0.5">Time</p>
                <p className="text-base font-medium">{formatTime(event.event_time)}</p>
              </div>
            </div>
          )}
          {event.venue && (
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
              <div>
                <p className="text-xs uppercase tracking-wider opacity-60 mb-0.5">Venue</p>
                <p className="text-base font-medium">{event.venue}</p>
                {event.address && <p className="text-sm opacity-70 mt-0.5">{event.address}</p>}
              </div>
            </div>
          )}
        </div>

        {(content.story || content.invitation_body) && (
          <div className="text-center mb-10 px-2">
            {content.invitation_body && (
              <p className="text-base leading-relaxed opacity-80 mb-4" style={{ fontFamily: "var(--font-body)" }}>
                {content.invitation_body}
              </p>
            )}
            {content.story && (
              <p className="text-base leading-relaxed italic" style={{ fontFamily: "var(--font-script)" }}>
                {content.story}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-3 mt-10">
          <Button
            onClick={() => navigate(`/${eventId}/rsvp`)}
            disabled={rsvpClosed}
            size="lg"
            style={{ backgroundColor: "var(--color-primary)", color: "#ffffff" }}
          >
            {content.rsvp_button_text || "RSVP"}
          </Button>
          {rsvpClosed && (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              RSVP is now closed
            </p>
          )}
          <button
            onClick={() => navigate(`/${eventId}/wishes`)}
            className="flex items-center gap-1.5 text-sm mt-2 transition-colors hover:opacity-80"
            style={{ color: "var(--color-accent)" }}
          >
            <MessageSquare className="w-4 h-4" />
            Leave a wish
          </button>
        </div>
      </div>
    </div>
  );
}

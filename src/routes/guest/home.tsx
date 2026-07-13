import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { formatDate, formatTime, isRsvpClosed } from "../../lib/utils";
import type { GuestLayoutContext } from "./guest-layout";
import { Calendar, Clock, MapPin, MapPinned } from "lucide-react";

export default function Home() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const outletCtx = useOutletContext<GuestLayoutContext | null>();

  const fallbackQuery = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    enabled: !!eventId && !outletCtx?.event,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  const event = outletCtx?.event || fallbackQuery.data || null;
  const isLoading = !outletCtx?.event && fallbackQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-slate-500">Event details unavailable.</p>
      </div>
    );
  }

  const content: EventContent = event.content || event.draft_content || {};
  const eventDate = event.event_date || event.draft_event_date || null;
  const eventTime = event.event_time || event.draft_event_time || null;
  const venue = event.venue || event.draft_venue || null;
  const address = event.address || event.draft_address || null;
  const story = content.story || "";
  const storyImage = content.story_image || "";
  const invitationTitle = content.invitation_title || "You're Invited";
  const invitationSubtitle = content.invitation_subtitle || "";
  const invitationBody = content.invitation_body || content.invitation_text || "";
  const rsvpText = content.rsvp_button_text || "RSVP";

  const deadline = event.rsvp_deadline || event.draft_rsvp_deadline || null;
  const rsvpClosed = isRsvpClosed(deadline);

  const handleRsvp = () => {
    if (eventId) navigate(`/${eventId}/rsvp`);
  };

  return (
    <div className="animate-fade-in">
      <section className="px-6 py-16 text-center max-w-2xl mx-auto">
        {invitationSubtitle && (
          <p className="italic text-lg mb-3" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-script)" }}>
            {invitationSubtitle}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl font-light mb-6" style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
          {invitationTitle}
        </h1>
        {invitationBody && (
          <p className="text-base leading-relaxed max-w-lg mx-auto" style={{ color: "var(--color-text)" }}>
            {invitationBody}
          </p>
        )}
      </section>

      <section className="px-6 py-8 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5">
              <Calendar className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--color-accent)" }}>
                When
              </p>
            </div>
            <p className="text-base" style={{ color: "var(--color-text)" }}>
              {eventDate ? formatDate(eventDate) : "To be announced"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--color-accent)" }}>
                Time
              </p>
            </div>
            <p className="text-base" style={{ color: "var(--color-text)" }}>
              {eventTime ? formatTime(eventTime) : "To be announced"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--color-accent)" }}>
                Where
              </p>
            </div>
            <p className="text-base" style={{ color: "var(--color-text)" }}>
              {venue || "To be announced"}
            </p>
            {address && (
              <p className="text-xs flex items-center justify-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                <MapPinned className="w-3 h-3" />
                {address}
              </p>
            )}
          </div>
        </div>
      </section>

      {story && (
        <section className="px-6 py-12 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-light tracking-wide mb-6" style={{ color: "var(--color-primary)", fontFamily: "var(--font-script)" }}>
            Our Story
          </h2>
          {storyImage && (
            <img
              src={storyImage}
              alt="Our story"
              className="w-full max-w-md mx-auto rounded-lg mb-8 object-cover"
              style={{ maxHeight: 320 }}
            />
          )}
          <p className="text-lg leading-relaxed italic max-w-lg mx-auto" style={{ color: "var(--color-text)", fontFamily: "var(--font-script)" }}>
            {story}
          </p>
        </section>
      )}

      <section className="px-6 py-12 max-w-2xl mx-auto text-center">
        <Button
          onClick={handleRsvp}
          disabled={rsvpClosed}
          size="lg"
          style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
        >
          {rsvpClosed ? "RSVP Closed" : rsvpText}
        </Button>
      </section>
    </div>
  );
}

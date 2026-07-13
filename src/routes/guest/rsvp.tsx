import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, Clock, MapPin, Check, X, Loader2 } from "lucide-react";
import { supabase, type WeddingEvent, type Rsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { getTheme, themeToCssVars } from "../../lib/theme";
import { formatDate, formatTime, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

interface EventWithRsvp extends WeddingEvent {
  rsvpStatus: Rsvp["status"] | "pending";
  rsvpId: string | null;
  submitting: boolean;
}

export function Rsvp() {
  const { slug } = useParams<{ slug: string }>();
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const [events, setEvents] = useState<EventWithRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!session) return;
    const { guest, wedding } = session;

    try {
      // 1. Fetch public events
      const { data: publicEvents, error: pubErr } = await supabase
        .from("events")
        .select("*")
        .eq("wedding_id", wedding.id)
        .eq("visibility", "public")
        .order("sort_order", { ascending: true });

      if (pubErr) throw pubErr;

      // 2. Fetch events invited via guest_event_invites
      const { data: guestInvites } = await supabase
        .from("guest_event_invites")
        .select("event_id")
        .eq("guest_id", guest.id);

      let invitedEvents: WeddingEvent[] = [];
      if (guestInvites && guestInvites.length > 0) {
        const eventIds = guestInvites.map((gi) => gi.event_id);
        const { data: eventsByGuest, error: ebgErr } = await supabase
          .from("events")
          .select("*")
          .in("id", eventIds)
          .eq("wedding_id", wedding.id);
        if (ebgErr) throw ebgErr;
        invitedEvents = (eventsByGuest || []) as WeddingEvent[];
      }

      // 3. Fetch events invited via group_event_invites
      let groupEvents: WeddingEvent[] = [];
      if (guest.group_id) {
        const { data: groupInvites } = await supabase
          .from("group_event_invites")
          .select("event_id")
          .eq("group_id", guest.group_id);

        if (groupInvites && groupInvites.length > 0) {
          const groupEventIds = groupInvites.map((gi) => gi.event_id);
          const { data: eventsByGroup, error: ebg2Err } = await supabase
            .from("events")
            .select("*")
            .in("id", groupEventIds)
            .eq("wedding_id", wedding.id);
          if (ebg2Err) throw ebg2Err;
          groupEvents = (eventsByGroup || []) as WeddingEvent[];
        }
      }

      // Merge & deduplicate
      const allEventsMap = new Map<string, WeddingEvent>();
      [...(publicEvents || []), ...invitedEvents, ...groupEvents].forEach((e) => {
        allEventsMap.set(e.id, e as WeddingEvent);
      });
      const allEvents = Array.from(allEventsMap.values()).sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      );

      // 4. Fetch existing RSVPs for this guest
      const { data: existingRsvps } = await supabase
        .from("rsvps")
        .select("*")
        .eq("guest_id", guest.id)
        .eq("wedding_id", wedding.id);

      const rsvpMap = new Map<string, { id: string; status: Rsvp["status"] }>();
      (existingRsvps || []).forEach((r) => {
        if (r.event_id) {
          rsvpMap.set(r.event_id, { id: r.id, status: (r as Rsvp).status });
        }
      });

      const eventsWithRsvp: EventWithRsvp[] = allEvents.map((e) => {
        const existing = rsvpMap.get(e.id);
        return {
          ...e,
          rsvpStatus: existing?.status || "pending",
          rsvpId: existing?.id || null,
          submitting: false,
        };
      });

      setEvents(eventsWithRsvp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRsvp = async (eventId: string, status: "accepted" | "declined") => {
    if (!session) return;
    const { guest, wedding } = session;
    const eventIndex = events.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) return;

    setEvents((prev) =>
      prev.map((e, i) => (i === eventIndex ? { ...e, submitting: true } : e))
    );

    try {
      const existing = events[eventIndex];
      if (existing.rsvpId) {
        // Update existing RSVP
        const { error: updateErr } = await supabase
          .from("rsvps")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", existing.rsvpId);
        if (updateErr) throw updateErr;
      } else {
        // Insert new RSVP
        const { data: newRsvp, error: insertErr } = await supabase
          .from("rsvps")
          .insert({
            wedding_id: wedding.id,
            guest_id: guest.id,
            guest_name: guest.full_name,
            guest_email: guest.email,
            event_id: eventId,
            status,
          })
          .select("id")
          .maybeSingle();
        if (insertErr) throw insertErr;
        existing.rsvpId = newRsvp?.id || null;
      }

      setEvents((prev) =>
        prev.map((e, i) =>
          i === eventIndex
            ? { ...e, rsvpStatus: status, submitting: false }
            : e
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "RSVP failed");
      setEvents((prev) =>
        prev.map((e, i) => (i === eventIndex ? { ...e, submitting: false } : e))
      );
    }
  };

  if (!session) return null;

  const theme = getTheme(session.wedding);
  const content = (session.wedding.content || {}) as Record<string, unknown>;
  const draftContent = (session.wedding.draft_content || {}) as Record<string, never>;
  const c = { ...content, ...draftContent };
  const rsvpIntro = (c.rsvp_intro as string) || "";
  const rsvpClosing = (c.rsvp_closing as string) || "";

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-16"
      style={themeToCssVars(theme) as React.CSSProperties}
    >
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-4 opacity-0-init animate-fade-in">
            {t("invitation")}
          </p>
          <h1 className="font-script text-4xl md:text-5xl text-[var(--color-text)] mb-4 opacity-0-init animate-fade-in-up">
            {t("rsvp")}
          </h1>
          <div className="flex items-center justify-center gap-4 opacity-0-init animate-fade-in-up delay-100">
            <span className="h-px w-12 bg-[var(--color-primary)]/30" />
            <span className="text-[var(--color-primary)] text-xs">✦</span>
            <span className="h-px w-12 bg-[var(--color-primary)]/30" />
          </div>
          {rsvpIntro && (
            <p className="font-body text-lg text-[var(--color-text)] leading-relaxed mt-6 opacity-0-init animate-fade-in-up delay-200">
              {rsvpIntro}
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-[var(--color-primary)] animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="font-ui text-sm text-[var(--color-error)] text-center mb-6">{error}</p>
        )}

        {/* No events */}
        {!loading && !error && events.length === 0 && (
          <p className="font-body text-lg text-[var(--color-text-muted)] text-center py-12">
            {t("noEvents")}
          </p>
        )}

        {/* Event cards */}
        {!loading && events.length > 0 && (
          <div className="space-y-6">
            {events.map((event, idx) => (
              <div
                key={event.id}
                className={cn(
                  "bg-[var(--color-surface)] border border-[var(--color-primary)]/15 p-6 md:p-8 opacity-0-init animate-fade-in-up",
                  `delay-${Math.min(idx + 1, 5) * 100}`
                )}
                style={{ borderRadius: "8px" }}
              >
                {/* Event name */}
                <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">
                  {event.name}
                </h2>
                <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)] mb-4">
                  {event.kind}
                </p>

                {/* Event details */}
                <div className="space-y-2 mb-6">
                  {event.starts_at && (
                    <>
                      <div className="flex items-center gap-2 text-[var(--color-text)]">
                        <CalendarDays size={14} className="text-[var(--color-primary)]" />
                        <span className="font-body text-sm">
                          {formatDate(event.starts_at, lang)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                        <Clock size={14} className="text-[var(--color-primary)]" />
                        <span className="font-ui text-sm">
                          {formatTime(event.starts_at, lang)}
                        </span>
                      </div>
                    </>
                  )}
                  {event.venue_name && (
                    <div className="flex items-start gap-2 text-[var(--color-text)]">
                      <MapPin size={14} className="text-[var(--color-primary)] mt-0.5" />
                      <span className="font-body text-sm">
                        {event.venue_name}
                        {event.venue_address && `, ${event.venue_address}`}
                      </span>
                    </div>
                  )}
                  {event.dress_code && (
                    <p className="font-ui text-xs text-[var(--color-text-muted)] pl-6">
                      {t("dressCode")}: {event.dress_code}
                    </p>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <p className="font-body text-sm text-[var(--color-text-muted)] leading-relaxed mb-6">
                    {event.description}
                  </p>
                )}

                {/* RSVP buttons */}
                <div className="flex gap-3">
                  <Button
                    variant={event.rsvpStatus === "accepted" ? "primary" : "outline"}
                    size="md"
                    disabled={event.submitting}
                    onClick={() => handleRsvp(event.id, "accepted")}
                    className="flex-1"
                  >
                    {event.submitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : event.rsvpStatus === "accepted" ? (
                      <>
                        <Check size={14} className="mr-1.5" />
                        {t("accepted")}
                      </>
                    ) : (
                      t("accept")
                    )}
                  </Button>
                  <Button
                    variant={event.rsvpStatus === "declined" ? "danger" : "outline"}
                    size="md"
                    disabled={event.submitting}
                    onClick={() => handleRsvp(event.id, "declined")}
                    className="flex-1"
                  >
                    {event.rsvpStatus === "declined" ? (
                      <>
                        <X size={14} className="mr-1.5" />
                        {t("declined")}
                      </>
                    ) : (
                      t("decline")
                    )}
                  </Button>
                </div>

                {/* Pending indicator */}
                {event.rsvpStatus === "pending" && !event.submitting && (
                  <p className="font-ui text-xs text-[var(--color-text-muted)] text-center mt-3">
                    {t("pending")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Closing */}
        {rsvpClosing && !loading && events.length > 0 && (
          <p className="font-body text-lg text-[var(--color-text)] leading-relaxed italic text-center mt-10 opacity-0-init animate-fade-in-up delay-500">
            {rsvpClosing}
          </p>
        )}
      </div>
    </div>
  );
}

export default Rsvp;

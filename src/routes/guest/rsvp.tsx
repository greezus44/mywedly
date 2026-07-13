import { useState, useEffect, useCallback } from "react";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type WeddingEvent, type Rsvp } from "../../lib/supabase";
import { themeToCssVars, getTheme, getCoverContent } from "../../lib/theme";
import { formatDate, formatTime, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Check, Calendar, Clock, MapPin, Home as HomeIcon, Shirt, ScrollText } from "lucide-react";

interface EventWithRsvp extends WeddingEvent {
  rsvp?: Rsvp | null;
}

export function Rsvp() {
  const { lang, t } = useLang();
  const { session } = useGuestAuth();
  const guest = session?.guest;
  const wedding = session?.wedding;
  const [events, setEvents] = useState<EventWithRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<Record<string, "accepted" | "declined" | null>>({});
  const [successEvent, setSuccessEvent] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!guest || !wedding) return;
    setLoading(true);

    // Fetch all event IDs the guest is invited to via three sources, deduped
    const [guestInvites, groupInvites, publicEvents] = await Promise.all([
      supabase.from("guest_event_invites").select("event_id").eq("guest_id", guest.id),
      guest.group_id
        ? supabase.from("group_event_invites").select("event_id").eq("group_id", guest.group_id)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("events").select("id").eq("wedding_id", wedding.id).eq("visibility", "public"),
    ]);

    const eventIds = new Set<string>();
    (guestInvites.data || []).forEach((r) => eventIds.add(r.event_id));
    (groupInvites.data || []).forEach((r) => eventIds.add(r.event_id));
    (publicEvents.data || []).forEach((r) => eventIds.add(r.id));

    if (eventIds.size === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const { data: eventRows } = await supabase
      .from("events")
      .select("*")
      .in("id", Array.from(eventIds))
      .order("sort_order", { ascending: true })
      .order("starts_at", { ascending: true });

    // Fetch existing RSVPs for this guest
    const { data: rsvpRows } = await supabase
      .from("rsvps")
      .select("*")
      .eq("guest_id", guest.id)
      .eq("wedding_id", wedding.id);

    const rsvpByEvent: Record<string, Rsvp> = {};
    (rsvpRows || []).forEach((r) => {
      if (r.event_id) rsvpByEvent[r.event_id] = r as Rsvp;
    });

    const merged: EventWithRsvp[] = (eventRows || []).map((e) => {
      const ev = e as WeddingEvent;
      const rsvp = rsvpByEvent[ev.id] || null;
      return { ...ev, rsvp };
    });

    setEvents(merged);
    setLoading(false);
  }, [guest, wedding]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleRsvp = async (eventId: string, status: "accepted" | "declined") => {
    if (!guest || !wedding) return;
    setRsvpStatus((s) => ({ ...s, [eventId]: status }));
    const existing = events.find((e) => e.id === eventId)?.rsvp;

    if (existing) {
      await supabase
        .from("rsvps")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("rsvps").insert({
        wedding_id: wedding.id,
        guest_id: guest.id,
        guest_name: guest.full_name,
        guest_email: guest.email,
        status,
        event_id: eventId,
      });
    }

    setSuccessEvent(eventId);
    setTimeout(() => setSuccessEvent(null), 2500);
    await loadEvents();
    setRsvpStatus((s) => ({ ...s, [eventId]: null }));
  };

  if (!wedding || !guest) return null;

  const theme = getTheme(wedding);
  const content = getCoverContent(wedding);
  const intro = content.rsvp_intro || "";
  const closing = content.rsvp_closing || "";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]" style={themeToCssVars(theme) as React.CSSProperties}>
      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-4 opacity-0-init animate-fade-in">
            {t("invitation")}
          </p>
          <h1 className="font-script text-4xl md:text-5xl text-[var(--color-text)] mb-4 opacity-0-init animate-fade-in-up delay-100">
            {t("rsvp")}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-6 opacity-0-init animate-fade-in delay-200">
            <span className="h-px w-12 bg-[var(--color-border)]/40" />
            <span className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-primary)]">♡</span>
            <span className="h-px w-12 bg-[var(--color-border)]/40" />
          </div>
          {intro && (
            <p className="font-body text-lg text-[var(--color-text-muted)] max-w-md mx-auto opacity-0-init animate-fade-in-up delay-300">
              {intro}
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted)] py-20">
            {t("loading")}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center font-body text-lg text-[var(--color-text-muted)] py-20">
            {t("noEvents")}
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event, idx) => {
              const currentStatus = event.rsvp?.status;
              const isAccepted = currentStatus === "accepted";
              const isDeclined = currentStatus === "declined";
              const showSuccess = successEvent === event.id;
              const delayClasses = ["delay-300", "delay-400", "delay-500", "delay-700", "delay-1000"];
              const delayClass = delayClasses[idx % delayClasses.length];

              return (
                <div
                  key={event.id}
                  className={cn(
                    "bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-xl shadow-[0_2px_8px_rgba(184,151,58,0.08)] p-7 md:p-9 opacity-0-init animate-fade-in-up",
                    delayClass
                  )}
                  style={{ borderRadius: "var(--button-radius, 8px)" }}
                >
                  {/* Event name */}
                  <h2 className="font-heading text-2xl md:text-3xl text-[var(--color-text)] text-center mb-6">
                    {event.name}
                  </h2>

                  <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="h-px w-10 bg-[var(--color-border)]/30" />
                    <span className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-primary)]">♡</span>
                    <span className="h-px w-10 bg-[var(--color-border)]/30" />
                  </div>

                  {/* Event details */}
                  <div className="space-y-3 mb-8">
                    {event.starts_at && (
                      <div className="flex items-start gap-3">
                        <Calendar size={16} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                        <div>
                          <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{t("date")}</p>
                          <p className="font-body text-base text-[var(--color-text)]">{formatDate(event.starts_at, lang)}</p>
                        </div>
                      </div>
                    )}
                    {event.starts_at && (
                      <div className="flex items-start gap-3">
                        <Clock size={16} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                        <div>
                          <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{t("time")}</p>
                          <p className="font-body text-base text-[var(--color-text)]">{formatTime(event.starts_at, lang)}</p>
                        </div>
                      </div>
                    )}
                    {event.venue_name && (
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                        <div>
                          <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{t("venue")}</p>
                          <p className="font-body text-base text-[var(--color-text)]">{event.venue_name}</p>
                        </div>
                      </div>
                    )}
                    {event.venue_address && (
                      <div className="flex items-start gap-3">
                        <HomeIcon size={16} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                        <div>
                          <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{t("address")}</p>
                          <p className="font-body text-base text-[var(--color-text)]">{event.venue_address}</p>
                        </div>
                      </div>
                    )}
                    {event.dress_code && (
                      <div className="flex items-start gap-3">
                        <Shirt size={16} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                        <div>
                          <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{t("dressCode")}</p>
                          <p className="font-body text-base text-[var(--color-text)]">{event.dress_code}</p>
                        </div>
                      </div>
                    )}
                    {event.programme && (
                      <div className="flex items-start gap-3">
                        <ScrollText size={16} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                        <div>
                          <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{t("programme")}</p>
                          <p className="font-body text-base text-[var(--color-text)] whitespace-pre-line">{event.programme}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RSVP status */}
                  <div className="text-center mb-5">
                    <p className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-text-muted)] mb-1">
                      {t("rsvp")}
                    </p>
                    <p className={cn(
                      "font-heading text-lg",
                      isAccepted ? "text-[var(--color-success)]" : isDeclined ? "text-[var(--color-error)]" : "text-[var(--color-text-muted)]"
                    )}>
                      {isAccepted ? t("accepted") : isDeclined ? t("declined") : t("pending")}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant={isAccepted ? "primary" : "outline"}
                      size="md"
                      disabled={!!rsvpStatus[event.id]}
                      onClick={() => handleRsvp(event.id, "accepted")}
                      className="flex-1"
                    >
                      {rsvpStatus[event.id] === "accepted" ? t("loading") : t("accept")}
                    </Button>
                    <Button
                      variant={isDeclined ? "danger" : "outline"}
                      size="md"
                      disabled={!!rsvpStatus[event.id]}
                      onClick={() => handleRsvp(event.id, "declined")}
                      className="flex-1"
                    >
                      {rsvpStatus[event.id] === "declined" ? t("loading") : t("decline")}
                    </Button>
                  </div>

                  {/* Success animation */}
                  {showSuccess && (
                    <div className="flex items-center justify-center gap-2 mt-5 text-[var(--color-success)] animate-success-pop">
                      <Check size={18} />
                      <span className="font-ui text-xs uppercase tracking-wider-luxe">
                        {event.rsvp?.status === "accepted" ? t("accepted") : t("declined")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {closing && !loading && events.length > 0 && (
          <p className="font-body text-lg text-[var(--color-text-muted)] text-center mt-16 max-w-md mx-auto opacity-0-init animate-fade-in-up delay-500">
            {closing}
          </p>
        )}
      </div>
    </div>
  );
}

export default Rsvp;

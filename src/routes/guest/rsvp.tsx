import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, MapPin, MapPinHouse, Check, X, PartyPopper } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getContent } from "../../lib/theme";
import { formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../lib/supabase";
import type { WeddingEvent, Rsvp as RsvpType } from "../../lib/supabase";

export function Rsvp() {
  const { session } = useGuestAuth();
  const { lang, t } = useLang();

  const wedding = session?.wedding || null;
  const theme = getTheme(wedding);
  const cssVars = themeToCssVars(theme);
  const content = getContent(wedding!);

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, RsvpType | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [successEvent, setSuccessEvent] = useState<string | null>(null);

  const guest = session?.guest || null;

  const loadEvents = useCallback(async () => {
    if (!guest || !wedding) return;
    setLoading(true);

    // Get events the guest is directly invited to
    const { data: guestInvites } = await supabase
      .from("guest_event_invites")
      .select("event_id")
      .eq("guest_id", guest.id);

    const guestEventIds = (guestInvites || []).map((i) => i.event_id);

    // Get events the guest's group is invited to
    let groupEventIds: string[] = [];
    if (guest.group_id) {
      const { data: groupInvites } = await supabase
        .from("group_event_invites")
        .select("event_id")
        .eq("group_id", guest.group_id);
      groupEventIds = (groupInvites || []).map((i) => i.event_id);
    }

    // Also include public events
    const { data: publicEvents } = await supabase
      .from("events")
      .select("*")
      .eq("wedding_id", wedding.id)
      .eq("visibility", "public")
      .order("sort_order", { ascending: true });

    const invitedEventIds = Array.from(new Set([...guestEventIds, ...groupEventIds]));

    let invitedEvents: WeddingEvent[] = [];
    if (invitedEventIds.length > 0) {
      const { data } = await supabase
        .from("events")
        .select("*")
        .in("id", invitedEventIds)
        .order("sort_order", { ascending: true });
      invitedEvents = (data || []) as WeddingEvent[];
    }

    // Merge public + invited, dedupe by id
    const allEvents = [...invitedEvents, ...((publicEvents || []) as WeddingEvent[])];
    const seen = new Set<string>();
    const deduped = allEvents.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    // Sort by starts_at then sort_order
    deduped.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      if (a.starts_at && b.starts_at) return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      return 0;
    });

    setEvents(deduped);

    // Load existing RSVPs for this guest
    if (deduped.length > 0) {
      const { data: existingRsvps } = await supabase
        .from("rsvps")
        .select("*")
        .eq("guest_id", guest.id)
        .eq("wedding_id", wedding.id);

      const rsvpMap: Record<string, RsvpType | null> = {};
      (existingRsvps || []).forEach((r) => {
        if (r.event_id) rsvpMap[r.event_id] = r as RsvpType;
      });
      setRsvps(rsvpMap);
    }

    setLoading(false);
  }, [guest, wedding]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleRsvp = async (eventId: string, status: "accepted" | "declined") => {
    if (!guest || !wedding || submitting) return;
    setSubmitting(eventId);
    setSuccessEvent(null);

    const existing = rsvps[eventId];

    if (existing) {
      // Update existing RSVP
      const { error } = await supabase
        .from("rsvps")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (!error) {
        setRsvps((prev) => ({ ...prev, [eventId]: { ...existing, status } }));
        setSuccessEvent(eventId);
      }
    } else {
      // Create new RSVP
      const { data, error } = await supabase
        .from("rsvps")
        .insert({
          wedding_id: wedding.id,
          guest_id: guest.id,
          guest_name: guest.full_name,
          guest_email: guest.email,
          status,
          event_id: eventId,
        })
        .select("*")
        .single();
      if (!error && data) {
        setRsvps((prev) => ({ ...prev, [eventId]: data as RsvpType }));
        setSuccessEvent(eventId);
      }
    }

    setSubmitting(null);
    // Clear success animation after 2.5s
    setTimeout(() => setSuccessEvent(null), 2500);
  };

  if (loading) {
    return (
      <div style={cssVars} className="min-h-[60vh] flex items-center justify-center bg-[var(--color-bg)]">
        <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted)] animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (!wedding || !guest) return null;

  return (
    <div style={cssVars} className="bg-[var(--color-bg)] min-h-screen pb-20">
      {/* Header */}
      <section className="max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-10 text-center">
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-4 animate-fade-in-down opacity-0-init">
          {t("kindlyRespond")}
        </p>
        <h1 className="font-script text-4xl md:text-5xl text-[var(--color-primary)] mb-6 animate-fade-in-up opacity-0-init delay-100">
          {t("rsvp")}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
          <div className="w-1.5 h-1.5 rounded-full border border-[var(--color-border)]/40" />
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
        </div>
        {content.rsvp_intro && (
          <p className="font-body text-lg text-[var(--color-text)] leading-relaxed max-w-xl mx-auto animate-fade-in-up opacity-0-init delay-200">
            {content.rsvp_intro}
          </p>
        )}
      </section>

      {/* Event cards */}
      {events.length === 0 ? (
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="font-heading text-xl text-[var(--color-text-muted)] italic">
            {t("noEvents")}
          </p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-6 flex flex-col gap-6">
          {events.map((event, idx) => {
            const rsvp = rsvps[event.id];
            const currentStatus = rsvp?.status || "pending";
            const isSuccess = successEvent === event.id;
            const isSubmittingThis = submitting === event.id;

            return (
              <div
                key={event.id}
                className={`bg-[var(--color-surface)] border rounded-lg p-6 md:p-8 animate-fade-in-up opacity-0-init delay-${(idx + 1) * 100} ${
                  isSuccess ? "border-[var(--color-success)]" : "border-[var(--color-border)]/25"
                }`}
                style={{ borderRadius: "var(--button-radius, 8px)" }}
              >
                {/* Event name */}
                <h2 className="font-script text-3xl text-[var(--color-primary)] text-center mb-1">
                  {event.name}
                </h2>
                {event.description && (
                  <p className="font-heading text-base text-[var(--color-text-muted)] text-center italic mb-6">
                    {event.description}
                  </p>
                )}

                {/* Event image */}
                {event.image_url && (
                  <div className="mb-6 -mt-2">
                    <img
                      src={event.image_url}
                      alt={event.name}
                      className="w-full h-48 md:h-56 object-cover rounded-lg"
                      style={{ borderRadius: "var(--button-radius, 8px)" }}
                    />
                  </div>
                )}

                {/* Event details */}
                <div className="flex flex-col gap-3 mb-6">
                  {event.starts_at && (
                    <div className="flex items-start gap-3">
                      <Calendar size={16} className="text-[var(--color-primary)] mt-1 shrink-0" />
                      <div>
                        <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                          {t("date")}
                        </p>
                        <p className="font-body text-base text-[var(--color-text)]">
                          {formatDate(event.starts_at, lang)}
                        </p>
                      </div>
                    </div>
                  )}
                  {event.starts_at && (
                    <div className="flex items-start gap-3">
                      <Clock size={16} className="text-[var(--color-primary)] mt-1 shrink-0" />
                      <div>
                        <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                          {t("time")}
                        </p>
                        <p className="font-body text-base text-[var(--color-text)]">
                          {formatTime(event.starts_at, lang)}
                        </p>
                      </div>
                    </div>
                  )}
                  {event.venue_name && (
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-[var(--color-primary)] mt-1 shrink-0" />
                      <div>
                        <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                          {t("venue")}
                        </p>
                        <p className="font-body text-base text-[var(--color-text)]">
                          {event.venue_name}
                        </p>
                      </div>
                    </div>
                  )}
                  {event.venue_address && (
                    <div className="flex items-start gap-3">
                      <MapPinHouse size={16} className="text-[var(--color-primary)] mt-1 shrink-0" />
                      <div>
                        <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                          {t("address")}
                        </p>
                        <p className="font-body text-base text-[var(--color-text)]">
                          {event.venue_address}
                        </p>
                      </div>
                    </div>
                  )}
                  {event.dress_code && (
                    <div className="flex items-start gap-3">
                      <div className="w-4 mt-1 shrink-0" />
                      <div>
                        <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                          {t("dressCode")}
                        </p>
                        <p className="font-body text-base text-[var(--color-text)]">
                          {event.dress_code}
                        </p>
                      </div>
                    </div>
                  )}
                  {event.programme && (
                    <div className="flex items-start gap-3">
                      <div className="w-4 mt-1 shrink-0" />
                      <div>
                        <p className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                          {t("programme")}
                        </p>
                        <p className="font-body text-base text-[var(--color-text)] whitespace-pre-line">
                          {event.programme}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* RSVP deadline */}
                {event.rsvp_deadline && (
                  <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] text-center mb-4">
                    {t("respondBy")} {formatDate(event.rsvp_deadline, lang)}
                  </p>
                )}

                {/* Success animation */}
                {isSuccess && (
                  <div className="flex items-center justify-center gap-2 py-3 mb-4 animate-success-pop">
                    <PartyPopper size={20} className="text-[var(--color-success)]" />
                    <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-success)]">
                      {currentStatus === "accepted" ? t("accepted") : t("declined")}!
                    </p>
                  </div>
                )}

                {/* Current status badge */}
                {currentStatus !== "pending" && !isSuccess && (
                  <div className="text-center mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-ui text-xs uppercase tracking-wider-luxe ${
                        currentStatus === "accepted"
                          ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                          : "bg-[var(--color-error)]/15 text-[var(--color-error)]"
                      }`}
                    >
                      {currentStatus === "accepted" ? <Check size={12} /> : <X size={12} />}
                      {t("rsvpStatus")}: {currentStatus === "accepted" ? t("accepted") : t("declined")}
                    </span>
                  </div>
                )}

                {/* Accept / Decline buttons */}
                <div className="flex gap-3">
                  <Button
                    variant={currentStatus === "accepted" ? "primary" : "outline"}
                    size="md"
                    onClick={() => handleRsvp(event.id, "accepted")}
                    disabled={isSubmittingThis}
                    className="flex-1"
                  >
                    <Check size={14} className="mr-2" />
                    {t("accept")}
                  </Button>
                  <Button
                    variant={currentStatus === "declined" ? "danger" : "outline"}
                    size="md"
                    onClick={() => handleRsvp(event.id, "declined")}
                    disabled={isSubmittingThis}
                    className="flex-1"
                  >
                    <X size={14} className="mr-2" />
                    {t("decline")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Closing text */}
      {content.rsvp_closing && (
        <div className="max-w-2xl mx-auto px-6 pt-10 text-center">
          <p className="font-heading text-base text-[var(--color-text-muted)] italic">
            {content.rsvp_closing}
          </p>
        </div>
      )}
    </div>
  );
}

export default Rsvp;

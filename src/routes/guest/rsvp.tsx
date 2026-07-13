import { useState, useEffect, useCallback } from "react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import type { TranslationKey } from "../../lib/i18n";
import { themeToCssVars, getCoverContent } from "../../lib/theme";
import { getCountdown, formatDate, formatTime, cn } from "../../lib/utils";
import { supabase, type WeddingEvent, type Rsvp, type RsvpStatus } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Calendar, Clock, MapPin, User, Shirt, ClipboardList, Check, X } from "lucide-react";

export function Rsvp() {
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, RsvpStatus>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const fetchEventsAndRsvps = useCallback(async () => {
    if (!session) return;
    const { guest, wedding } = session;
    const weddingId = wedding.id;

    // 1. Fetch public events
    const { data: publicEvents } = await supabase
      .from("events")
      .select("*")
      .eq("wedding_id", weddingId)
      .eq("visibility", "public")
      .order("sort_order", { ascending: true });

    // 2. Fetch guest_event_invites
    const { data: guestInvites } = await supabase
      .from("guest_event_invites")
      .select("event_id")
      .eq("guest_id", guest.id);

    let privateEvents: WeddingEvent[] = [];
    if (guestInvites && guestInvites.length > 0) {
      const eventIds = guestInvites.map((gi) => gi.event_id);
      const { data: invitedEvents } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds)
        .order("sort_order", { ascending: true });
      privateEvents = (invitedEvents as WeddingEvent[]) || [];
    }

    // 3. Fetch group_event_invites (if guest has a group_id)
    let groupEvents: WeddingEvent[] = [];
    if (guest.group_id) {
      const { data: groupInvites } = await supabase
        .from("group_event_invites")
        .select("event_id")
        .eq("group_id", guest.group_id);

      if (groupInvites && groupInvites.length > 0) {
        const groupEventIds = groupInvites.map((gi) => gi.event_id);
        const { data: gEvents } = await supabase
          .from("events")
          .select("*")
          .in("id", groupEventIds)
          .order("sort_order", { ascending: true });
        groupEvents = (gEvents as WeddingEvent[]) || [];
      }
    }

    // 4. Dedupe by event id
    const allEvents = [...(publicEvents as WeddingEvent[] || []), ...privateEvents, ...groupEvents];
    const seen = new Set<string>();
    const deduped = allEvents.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    deduped.sort((a, b) => a.sort_order - b.sort_order);
    setEvents(deduped);

    // 5. Fetch existing RSVPs for this guest
    const { data: existingRsvps } = await supabase
      .from("rsvps")
      .select("*")
      .eq("guest_id", guest.id)
      .eq("wedding_id", weddingId);

    const rsvpMap: Record<string, RsvpStatus> = {};
    (existingRsvps as Rsvp[] || []).forEach((rsvp) => {
      if (rsvp.event_id) {
        rsvpMap[rsvp.event_id] = rsvp.status;
      }
    });
    setRsvps(rsvpMap);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchEventsAndRsvps();
  }, [fetchEventsAndRsvps]);

  const handleRsvp = async (event: WeddingEvent, status: RsvpStatus) => {
    if (!session) return;
    const { guest, wedding } = session;
    setSubmittingId(event.id);
    setSuccessId(null);

    // Check if RSVP already exists for this event
    const { data: existing } = await supabase
      .from("rsvps")
      .select("*")
      .eq("guest_id", guest.id)
      .eq("event_id", event.id)
      .maybeSingle();

    if (existing) {
      // Update existing RSVP
      await supabase
        .from("rsvps")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", (existing as Rsvp).id);
    } else {
      // Insert new RSVP
      await supabase.from("rsvps").insert({
        wedding_id: wedding.id,
        guest_id: guest.id,
        guest_name: guest.full_name,
        guest_email: guest.email,
        status,
        event_id: event.id,
      });
    }

    setRsvps((prev) => ({ ...prev, [event.id]: status }));
    setSubmittingId(null);
    setSuccessId(event.id);
    setTimeout(() => setSuccessId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[var(--color-bg)] py-20">
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (!session) return null;

  const { wedding } = session;
  const content = getCoverContent(wedding);
  const theme = wedding.theme_config && "colors" in wedding.theme_config ? wedding.theme_config : null;

  return (
    <div
      style={themeToCssVars(theme) as React.CSSProperties}
      className="min-h-full bg-[var(--color-bg)] py-16 md:py-20 px-6"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up opacity-0-init">
          <h2 className="font-heading text-3xl md:text-4xl text-[var(--color-primary)] mb-3">
            {t("rsvp")}
          </h2>
          {content.rsvp_intro && (
            <p className="font-body text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
              {content.rsvp_intro}
            </p>
          )}
        </div>

        {/* Events */}
        {events.length === 0 ? (
          <p className="text-center font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted)] py-12">
            {t("noEvents")}
          </p>
        ) : (
          <div className="space-y-6">
            {events.map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                status={rsvps[event.id] || "pending"}
                submitting={submittingId === event.id}
                success={successId === event.id}
                onAccept={() => handleRsvp(event, "accepted")}
                onDecline={() => handleRsvp(event, "declined")}
                delay={idx * 100}
                lang={lang}
                t={t}
              />
            ))}
          </div>
        )}

        {/* RSVP Closing */}
        {content.rsvp_closing && (
          <p className="font-body text-sm text-[var(--color-text-muted)] text-center italic mt-10 animate-fade-in opacity-0-init delay-500">
            {content.rsvp_closing}
          </p>
        )}

        {/* RSVP Deadline */}
        {wedding.rsvp_deadline && (
          <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] text-center mt-6">
            {t("respondBy")} {formatDate(wedding.rsvp_deadline, lang)}
          </p>
        )}
      </div>
    </div>
  );
}

interface EventCardProps {
  event: WeddingEvent;
  status: RsvpStatus;
  submitting: boolean;
  success: boolean;
  onAccept: () => void;
  onDecline: () => void;
  delay: number;
  lang: "en" | "ms";
  t: (key: TranslationKey) => string;
}

function EventCard({ event, status, submitting, success, onAccept, onDecline, delay, lang, t }: EventCardProps) {
  const countdown = getCountdown(event.starts_at);

  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg p-6 md:p-8 shadow-[var(--shadow-soft)] animate-fade-in-up opacity-0-init"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Event Name */}
      <div className="text-center mb-6">
        <h3 className="font-heading text-xl md:text-2xl text-[var(--color-primary)] mb-2">
          {event.name}
        </h3>
        {event.starts_at && (
          <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
            {formatDate(event.starts_at, lang)}
          </p>
        )}
      </div>

      {/* Event Details */}
      <div className="space-y-3 mb-6">
        {event.starts_at && (
          <div className="flex items-start gap-3">
            <Clock size={15} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)] block">
                {t("time")}
              </span>
              <span className="font-ui text-sm text-[var(--color-text)]">
                {formatTime(event.starts_at, lang)}
              </span>
            </div>
          </div>
        )}

        {event.venue_name && (
          <div className="flex items-start gap-3">
            <MapPin size={15} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)] block">
                {t("venue")}
              </span>
              <span className="font-ui text-sm text-[var(--color-text)]">
                {event.venue_name}
              </span>
            </div>
          </div>
        )}

        {event.venue_address && (
          <div className="flex items-start gap-3">
            <MapPin size={15} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0 opacity-0" />
            <div>
              <span className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)] block">
                {t("address")}
              </span>
              <span className="font-ui text-sm text-[var(--color-text)]">
                {event.venue_address}
              </span>
            </div>
          </div>
        )}

        {event.dress_code && (
          <div className="flex items-start gap-3">
            <Shirt size={15} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)] block">
                {t("dressCode")}
              </span>
              <span className="font-ui text-sm text-[var(--color-text)]">
                {event.dress_code}
              </span>
            </div>
          </div>
        )}

        {event.programme && (
          <div className="flex items-start gap-3">
            <ClipboardList size={15} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)] block">
                {t("programme")}
              </span>
              <span className="font-body text-sm text-[var(--color-text)] whitespace-pre-line">
                {event.programme}
              </span>
            </div>
          </div>
        )}

        {event.notes && (
          <div className="flex items-start gap-3">
            <User size={15} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)] block">
                {t("notes")}
              </span>
              <span className="font-body text-sm text-[var(--color-text)]">
                {event.notes}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* RSVP Status Badge */}
      <div className="flex items-center justify-center mb-4">
        <span
          className={cn(
            "inline-flex items-center px-3 py-1 rounded-full font-ui text-[10px] uppercase tracking-wider-luxe",
            status === "accepted" && "bg-[var(--color-success)]/15 text-[var(--color-success)]",
            status === "declined" && "bg-[var(--color-error)]/15 text-[var(--color-error)]",
            status === "pending" && "bg-[var(--color-warning)]/15 text-[var(--color-warning)]"
          )}
        >
          {status === "accepted" && <Check size={12} className="mr-1" />}
          {status === "declined" && <X size={12} className="mr-1" />}
          {t(status === "tentative" ? "pending" : status)}
        </span>
      </div>

      {/* Accept / Decline Buttons */}
      <div className="flex gap-3">
        <Button
          variant={status === "accepted" ? "primary" : "outline"}
          size="md"
          onClick={onAccept}
          disabled={submitting}
          className="flex-1"
        >
          {submitting ? t("loading") : t("accept")}
        </Button>
        <Button
          variant={status === "declined" ? "danger" : "ghost"}
          size="md"
          onClick={onDecline}
          disabled={submitting}
          className="flex-1"
        >
          {t("decline")}
        </Button>
      </div>

      {/* Success Animation */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-[var(--color-success)] text-white rounded-full w-16 h-16 flex items-center justify-center animate-success-pop shadow-2xl">
            <Check size={28} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Rsvp;

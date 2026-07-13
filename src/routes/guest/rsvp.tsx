import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, MapPin, Check, X, Heart, Loader2 } from "lucide-react";
import { supabase, type WeddingEvent, type Rsvp, type GuestEventInvite, type GroupEventInvite } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, coverToCssVars, getCoverConfig, getCoverContent } from "../../lib/theme";
import { formatDate, formatTime, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

function RsvpInner() {
  const navigate = useNavigate();
  const params = useParams();
  const slug = params.slug || "";
  const { session, loading } = useGuestAuth();
  const { lang, t } = useLang();

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const wedding = session?.wedding ?? null;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [session, loading, slug, navigate]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setFetching(true);
      const guest = session.guest;
      const w = session.wedding;

      // Fetch all public events for the wedding
      const { data: publicEvents } = await supabase
        .from("wedding_events")
        .select("*")
        .eq("wedding_id", w.id)
        .eq("visibility", "public")
        .order("sort_order", { ascending: true });

      // Fetch guest-specific event invites
      const { data: guestInvites } = await supabase
        .from("guest_event_invites")
        .select("event_id")
        .eq("guest_id", guest.id);

      // Fetch group event invites (if guest has a group_id)
      let groupEventIds: string[] = [];
      if (guest.group_id) {
        const { data: groupInvites } = await supabase
          .from("group_event_invites")
          .select("event_id")
          .eq("group_id", guest.group_id);
        groupEventIds = (groupInvites as GroupEventInvite[] | null)?.map((g) => g.event_id) || [];
      }

      const guestEventIds = (guestInvites as GuestEventInvite[] | null)?.map((g) => g.event_id) || [];
      const publicIds = (publicEvents as WeddingEvent[] | null)?.map((e) => e.id) || [];

      // Merge: public + guest-specific + group-specific
      const allEventIds = new Set([...publicIds, ...guestEventIds, ...groupEventIds]);

      // Fetch all events by IDs
      const idsArray = Array.from(allEventIds);
      let allEvents: WeddingEvent[] = [];
      if (idsArray.length > 0) {
        const { data: evts } = await supabase
          .from("wedding_events")
          .select("*")
          .in("id", idsArray)
          .order("sort_order", { ascending: true });
        allEvents = (evts as WeddingEvent[] | null) || [];
      }

      setEvents(allEvents);

      // Fetch existing RSVPs for this guest
      const { data: existingRsvps } = await supabase
        .from("rsvps")
        .select("*")
        .eq("guest_id", guest.id);
      setRsvps((existingRsvps as Rsvp[] | null) || []);

      setFetching(false);
    })();
  }, [session]);

  const getRsvpForEvent = (eventId: string): Rsvp | undefined =>
    rsvps.find((r) => r.event_id === eventId);

  const handleRsvp = async (eventId: string, status: "accepted" | "declined") => {
    if (!session) return;
    setSubmitting(eventId);
    const guest = session.guest;
    const w = session.wedding;
    const existing = getRsvpForEvent(eventId);

    try {
      if (existing) {
        // Update existing RSVP
        const { data, error } = await supabase
          .from("rsvps")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select("*")
          .single();
        if (!error && data) {
          setRsvps((prev) =>
            prev.map((r) => (r.id === existing.id ? (data as Rsvp) : r))
          );
        }
      } else {
        // Create new RSVP
        const { data, error } = await supabase
          .from("rsvps")
          .insert({
            wedding_id: w.id,
            guest_id: guest.id,
            guest_name: guest.full_name,
            guest_email: guest.email,
            status,
            event_id: eventId,
          })
          .select("*")
          .single();
        if (!error && data) {
          setRsvps((prev) => [...prev, data as Rsvp]);
        }
      }
    } catch {
      /* ignore */
    }
    setSubmitting(null);
  };

  if (loading || !session) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)" } as CSSProperties}
      >
        <Heart size={24} className="animate-pulse" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const content = getCoverContent(wedding);

  return (
    <div
      className="min-h-screen pb-16"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as CSSProperties}
    >
      {/* Header */}
      <section className="px-6 md:px-12 pt-12 md:pt-16 text-center animate-fade-in opacity-0-init">
        <p
          className="font-ui text-xs uppercase tracking-luxe mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          {t("rsvp")}
        </p>
        <h1
          className="font-script text-3xl md:text-5xl mb-4"
          style={{ color: "var(--color-text)" }}
        >
          {t("invitation")}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
          <Heart size={14} style={{ color: "var(--color-primary)" }} />
          <div className="h-px w-12" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
        </div>
        {content.rsvp_intro && (
          <p
            className="font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            {content.rsvp_intro}
          </p>
        )}
      </section>

      {/* Events List */}
      <section className="px-6 md:px-12 py-8 max-w-2xl mx-auto">
        {fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-primary)" }} />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 animate-fade-in opacity-0-init">
            <p
              className="font-ui text-sm uppercase tracking-wider-luxe"
              style={{ color: "var(--color-text-muted)" }}
            >
              {t("noEvents")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((evt, idx) => {
              const rsvp = getRsvpForEvent(evt.id);
              const currentStatus = rsvp?.status || "pending";
              const isSubmittingThis = submitting === evt.id;

              const delayClass = ["delay-100", "delay-200", "delay-300", "delay-400", "delay-500"][Math.min(idx, 4)];

              return (
                <div
                  key={evt.id}
                  className={cn(
                    "p-6 md:p-8 animate-fade-in-up opacity-0-init",
                    delayClass
                  )}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--radius, 8px)",
                    border: "1px solid var(--color-border)",
                    borderColor: "color-mix(in srgb, var(--color-border) 20%, transparent)",
                    boxShadow: "0 2px 12px rgba(184, 151, 58, 0.06)",
                  }}
                >
                  {/* Event name */}
                  <h2
                    className="font-script text-2xl md:text-3xl mb-1"
                    style={{ color: "var(--color-text)" }}
                  >
                    {evt.name}
                  </h2>
                  {evt.kind && (
                    <p
                      className="font-ui text-[10px] uppercase tracking-luxe mb-4"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {evt.kind}
                    </p>
                  )}

                  {/* Event details */}
                  <div className="space-y-2 mb-6">
                    {evt.starts_at && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} style={{ color: "var(--color-text-muted)" }} />
                        <p
                          className="font-ui text-xs uppercase tracking-wider-luxe"
                          style={{ color: "var(--color-text)" }}
                        >
                          {formatDate(evt.starts_at, lang)}
                        </p>
                      </div>
                    )}
                    {evt.starts_at && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} style={{ color: "var(--color-text-muted)" }} />
                        <p
                          className="font-ui text-xs uppercase tracking-wider-luxe"
                          style={{ color: "var(--color-text)" }}
                        >
                          {formatTime(evt.starts_at, lang)}
                        </p>
                      </div>
                    )}
                    {evt.venue_name && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} style={{ color: "var(--color-text-muted)" }} />
                        <p
                          className="font-ui text-xs uppercase tracking-wider-luxe"
                          style={{ color: "var(--color-text)" }}
                        >
                          {evt.venue_name}
                        </p>
                      </div>
                    )}
                    {evt.venue_address && (
                      <p
                        className="font-body text-sm pl-6"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {evt.venue_address}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {evt.description && (
                    <p
                      className="font-body text-sm leading-relaxed mb-6"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {evt.description}
                    </p>
                  )}

                  {/* Current status */}
                  {currentStatus !== "pending" && (
                    <p
                      className="font-ui text-xs uppercase tracking-wider-luxe mb-4"
                      style={{
                        color:
                          currentStatus === "accepted"
                            ? "var(--color-success)"
                            : "var(--color-text-muted)",
                      }}
                    >
                      {currentStatus === "accepted" ? t("accepted") : t("declined")}
                    </p>
                  )}

                  {/* RSVP buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant={currentStatus === "accepted" ? "primary" : "outline"}
                      size="md"
                      onClick={() => handleRsvp(evt.id, "accepted")}
                      disabled={isSubmittingThis}
                      className="flex-1"
                    >
                      {isSubmittingThis ? (
                        <Loader2 size={14} className="animate-spin mr-1" />
                      ) : (
                        <Check size={14} className="mr-1" />
                      )}
                      {t("accept")}
                    </Button>
                    <Button
                      variant={currentStatus === "declined" ? "danger" : "outline"}
                      size="md"
                      onClick={() => handleRsvp(evt.id, "declined")}
                      disabled={isSubmittingThis}
                      className="flex-1"
                    >
                      {isSubmittingThis ? (
                        <Loader2 size={14} className="animate-spin mr-1" />
                      ) : (
                        <X size={14} className="mr-1" />
                      )}
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
          <p
            className="font-body text-sm md:text-base text-center mt-8 leading-relaxed animate-fade-in opacity-0-init delay-500"
            style={{ color: "var(--color-text-muted)" }}
          >
            {content.rsvp_closing}
          </p>
        )}
      </section>
    </div>
  );
}

export function Rsvp() {
  return (
    <GuestAuthProvider>
      <RsvpInner />
    </GuestAuthProvider>
  );
}

export default Rsvp;

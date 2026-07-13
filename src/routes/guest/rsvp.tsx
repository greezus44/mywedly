import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding, type WeddingEvent, type Rsvp, type WeddingContent } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import {
  themeToCssVars,
  getTheme,
  getLogoConfig,
  getLogoStyle,
  shouldShowLogo,
} from "../../lib/theme";
import { formatDate, formatTime, getDeviceType, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Check, Calendar, MapPin, Clock } from "lucide-react";

export function Rsvp() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLang();
  const { session } = useGuestAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, Rsvp | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submittedEvent, setSubmittedEvent] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) {
        setWedding(data as Wedding);
        const w = data as Wedding;
        supabase.from("events").select("*").eq("wedding_id", w.id).order("sort_order", { ascending: true }).then(({ data: evts }) => {
          setEvents((evts as WeddingEvent[]) || []);
          setLoading(false);
        });
        if (session?.guest_id) {
          supabase.from("rsvps").select("*").eq("guest_id", session.guest_id).then(({ data: rData }) => {
            if (rData) {
              const map: Record<string, Rsvp | undefined> = {};
              (rData as Rsvp[]).forEach((r) => { map[r.event_id] = r; });
              setRsvps(map);
            }
          });
        }
      } else {
        setLoading(false);
      }
    });
  }, [slug, session?.guest_id]);

  const theme = getTheme(wedding);
  const content = (wedding?.draft_content || wedding?.content || {}) as WeddingContent;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "rsvp");

  const handleRsvp = async (eventId: string, status: "attending" | "declined") => {
    if (!session?.guest_id || !wedding) return;
    setSubmitting(eventId);
    const existing = rsvps[eventId];

    if (existing) {
      const { data } = await supabase.from("rsvps").update({
        status,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id).select("*").single();
      if (data) {
        setRsvps((prev) => ({ ...prev, [eventId]: data as Rsvp }));
      }
    } else {
      const { data } = await supabase.from("rsvps").insert({
        wedding_id: wedding.id,
        guest_id: session.guest_id,
        event_id: eventId,
        status,
        number_of_guests: 1,
      }).select("*").single();
      if (data) {
        setRsvps((prev) => ({ ...prev, [eventId]: data as Rsvp }));
      }
    }

    setSubmitting(null);
    setSubmittedEvent(eventId);
    setTimeout(() => setSubmittedEvent(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" style={{ ...themeToCssVars(theme), background: "var(--color-bg)" } as React.CSSProperties}>
        <p className="font-body text-sm" style={{ color: "var(--color-text-muted)" }}>{t.loading}</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme), background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" } as React.CSSProperties}
    >
      {/* Logo */}
      {showLogo && logo.url && (
        <div className="flex justify-center pt-8">
          <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-10 text-center md:py-16">
        <p className="animate-fade-in-up text-[0.625rem] uppercase tracking-[0.4em]" style={{ color: "var(--color-text-muted)" }}>
          {lang === "ms" ? "RSVP" : "RSVP"}
        </p>
        <h1 className="mt-4 animate-fade-in-up font-heading text-3xl md:text-5xl" style={{ color: "var(--color-primary)", animationDelay: "0.1s" }}>
          {lang === "ms" ? "Jemputan" : "Invitation"}
        </h1>

        {/* Conditional using Boolean() and String() */}
        {Boolean(content.rsvp_intro) && (
          <p className="mx-auto mt-4 max-w-lg animate-fade-in-up font-body text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-muted)", animationDelay: "0.2s" }}>
            {String(content.rsvp_intro)}
          </p>
        )}
      </div>

      {/* Event cards */}
      <div className="mx-auto max-w-2xl px-6 pb-12">
        {events.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-body text-sm" style={{ color: "var(--color-text-muted)" }}>
              {lang === "ms" ? "Tiada acara dijumpai." : "No events found."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event, idx) => {
              const currentRsvp = rsvps[event.id];
              const isSubmitting = submitting === event.id;
              const justSubmitted = submittedEvent === event.id;

              return (
                <div
                  key={event.id}
                  className="animate-fade-in-up rounded-2xl border p-6 md:p-8"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-surface)",
                    animationDelay: `${0.1 * idx + 0.1}s`,
                  }}
                >
                  {/* Event name */}
                  <h3 className="font-heading text-xl md:text-2xl" style={{ color: "var(--color-primary)" }}>
                    {event.name}
                  </h3>

                  {/* Event details */}
                  <div className="mt-4 space-y-2">
                    {event.starts_at && (
                      <div className="flex items-center gap-2 font-body text-sm" style={{ color: "var(--color-text-muted)" }}>
                        <Calendar className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
                        {formatDate(event.starts_at, lang)}
                        <Clock className="ml-2 h-4 w-4" style={{ color: "var(--color-accent)" }} />
                        {formatTime(event.starts_at)}
                      </div>
                    )}
                    {event.venue_name && (
                      <div className="flex items-center gap-2 font-body text-sm" style={{ color: "var(--color-text-muted)" }}>
                        <MapPin className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
                        {event.venue_name}
                      </div>
                    )}
                    {event.venue_address && (
                      <p className="ml-6 font-body text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {event.venue_address}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="mt-4 font-body text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                      {event.description}
                    </p>
                  )}

                  {/* RSVP status */}
                  {currentRsvp && (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{
                      background: currentRsvp.status === "attending" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: currentRsvp.status === "attending" ? "#16a34a" : "#dc2626",
                    }}>
                      <Check className="h-3 w-3" />
                      {currentRsvp.status === "attending" ? t.attending : t.declined}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() => handleRsvp(event.id, "attending")}
                      disabled={isSubmitting}
                      className={cn("flex-1 transition", currentRsvp?.status === "attending" && "ring-2 ring-green-500")}
                      style={{
                        background: currentRsvp?.status === "attending" ? "#16a34a" : "var(--color-button-bg)",
                        color: "var(--color-button-text)",
                      } as React.CSSProperties}
                    >
                      {justSubmitted && currentRsvp?.status === "attending" ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Check className="h-4 w-4" /> {t.thankYou}
                        </span>
                      ) : (
                        t.attending
                      )}
                    </Button>
                    <Button
                      onClick={() => handleRsvp(event.id, "declined")}
                      disabled={isSubmitting}
                      variant="outline"
                      className={cn("flex-1 transition", currentRsvp?.status === "declined" && "ring-2 ring-red-500")}
                      style={{
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                      } as React.CSSProperties}
                    >
                      {t.declined}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Closing text */}
      {content.rsvp_closing && (
        <div className="px-6 pb-16 text-center">
          <p className="mx-auto max-w-lg font-body text-sm italic" style={{ color: "var(--color-text-muted)" }}>
            {content.rsvp_closing}
          </p>
        </div>
      )}
    </div>
  );
}

export default Rsvp;

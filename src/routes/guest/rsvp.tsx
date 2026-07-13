import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding, type WeddingEvent, type Rsvp } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import {
  themeToCssVars,
  getTheme,
  getLogoConfig,
  getLogoStyle,
  shouldShowLogo,
} from "../../lib/theme";
import { formatDate, formatTime, getDeviceType, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Heart, Calendar, MapPin, Clock, Check, X } from "lucide-react";

function RsvpInner() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading } = useGuestAuth();
  const { lang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, Rsvp | undefined>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!session || (slug && session.wedding_slug !== slug)) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [session, loading, slug, navigate]);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      supabase.from("weddings").select("*").eq("id", session.wedding_id).maybeSingle(),
      supabase
        .from("events")
        .select("*")
        .eq("wedding_id", session.wedding_id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("rsvps")
        .select("*")
        .eq("guest_id", session.guest_id),
    ]).then(([wRes, eRes, rRes]) => {
      if (wRes.data) setWedding(wRes.data as Wedding);
      if (eRes.data) setEvents(eRes.data as WeddingEvent[]);
      if (rRes.data) {
        const map: Record<string, Rsvp | undefined> = {};
        (rRes.data as Rsvp[]).forEach((r) => {
          map[r.event_id] = r;
        });
        setRsvps(map);
      }
      setPageLoading(false);
    });
  }, [session]);

  const handleRsvp = async (eventId: string, status: "attending" | "declined") => {
    if (!session) return;
    setSubmitting(eventId);
    const existing = rsvps[eventId];

    if (existing) {
      const { data } = await supabase
        .from("rsvps")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("*")
        .maybeSingle();
      if (data) {
        setRsvps((prev) => ({ ...prev, [eventId]: data as Rsvp }));
      }
    } else {
      const { data } = await supabase
        .from("rsvps")
        .insert({
          wedding_id: session.wedding_id,
          guest_id: session.guest_id,
          event_id: eventId,
          status,
          number_of_guests: 1,
        })
        .select("*")
        .maybeSingle();
      if (data) {
        setRsvps((prev) => ({ ...prev, [eventId]: data as Rsvp }));
      }
    }
    setSubmitting(null);
  };

  if (loading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <Heart className="h-8 w-8 animate-pulse" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!session) return null;

  const theme = getTheme(wedding);
  const content = (wedding?.content || wedding?.draft_content || {}) as Record<string, unknown>;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme) } as React.CSSProperties}
    >
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Logo */}
        {shouldShowLogo(logo, "rsvp") && logo.url && (
          <div className="mb-8 flex justify-center animate-fade-in">
            <img src={logo.url} alt="Logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <h1
            className="mb-2"
            style={{
              color: "var(--color-text)",
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
            }}
          >
            {t.rsvp}
          </h1>
          <div className="mx-auto flex w-16 items-center justify-center gap-2">
            <span className="h-px flex-1" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
            <Heart className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <span className="h-px flex-1" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
          </div>
        </div>

        {/* RSVP intro */}
        {Boolean(content.rsvp_intro) && String(content.rsvp_intro) && (
          <p
            className="mb-8 text-center leading-relaxed animate-fade-in-up"
            style={{
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-body)",
              animationDelay: "0.1s",
            }}
          >
            {String(content.rsvp_intro)}
          </p>
        )}

        {/* Event cards */}
        {events.length === 0 ? (
          <p
            className="text-center"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
          >
            {lang === "ms" ? "Tiada acara tersedia." : "No events available."}
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event, idx) => {
              const rsvp = rsvps[event.id];
              const isAttending = rsvp?.status === "attending";
              const isDeclined = rsvp?.status === "declined";

              return (
                <div
                  key={event.id}
                  className="rounded-2xl p-5 animate-fade-in-up"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    animationDelay: `${0.15 + idx * 0.1}s`,
                  }}
                >
                  {/* Event info */}
                  <div className="mb-4">
                    <h3
                      className="mb-2"
                      style={{
                        color: "var(--color-text)",
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.25rem",
                      }}
                    >
                      {event.name}
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {event.starts_at && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.starts_at, lang)}</span>
                          <Clock className="ml-1 h-4 w-4" />
                          <span>{formatTime(event.starts_at)}</span>
                        </div>
                      )}
                      {event.venue_name && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
                          <MapPin className="h-4 w-4" />
                          <span>{event.venue_name}</span>
                        </div>
                      )}
                      {event.venue_address && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
                          <MapPin className="h-4 w-4 opacity-0" />
                          <span>{event.venue_address}</span>
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* RSVP status / buttons */}
                  {rsvp && (
                    <div
                      className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                      style={{
                        background: isAttending
                          ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
                          : "color-mix(in srgb, var(--color-text-muted) 10%, transparent)",
                        color: isAttending ? "var(--color-primary)" : "var(--color-text-muted)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <Check className="h-4 w-4" />
                      {isAttending ? t.attending : t.declined}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRsvp(event.id, "attending")}
                      disabled={submitting === event.id}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                      )}
                      style={{
                        background: isAttending ? "var(--color-primary)" : "transparent",
                        color: isAttending ? "var(--color-button-text)" : "var(--color-primary)",
                        border: "1px solid var(--color-primary)",
                      }}
                    >
                      <Check className="h-4 w-4" />
                      {t.attending}
                    </button>
                    <button
                      onClick={() => handleRsvp(event.id, "declined")}
                      disabled={submitting === event.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                      style={{
                        background: isDeclined ? "var(--color-text-muted)" : "transparent",
                        color: isDeclined ? "white" : "var(--color-text-muted)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <X className="h-4 w-4" />
                      {t.declined}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* RSVP closing */}
        {typeof content.rsvp_closing === "string" && content.rsvp_closing && (
          <p
            className="mt-8 text-center italic leading-relaxed animate-fade-in-up"
            style={{
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-body)",
              animationDelay: "0.4s",
            }}
          >
            {content.rsvp_closing}
          </p>
        )}
      </div>
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

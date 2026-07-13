import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding, type WeddingEvent, type Rsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getLogoConfig, getLogoStyle, shouldShowLogo } from "../../lib/theme";
import { formatDate, formatTime, getDeviceType, cn } from "../../lib/utils";
import { Check, Clock, MapPin } from "lucide-react";

export function Rsvp() {
  const { slug } = useParams<{ slug: string }>();
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, Rsvp>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: wData } = await supabase.from("weddings").select("*").eq("slug", slug).maybeSingle();
      if (wData) {
        const w = wData as Wedding;
        setWedding(w);
        // Fetch events
        const { data: eData } = await supabase
          .from("events")
          .select("*")
          .eq("wedding_id", w.id)
          .order("sort_order", { ascending: true });
        if (eData) setEvents(eData as WeddingEvent[]);
        // Fetch existing RSVPs for this guest
        if (session?.guest_id) {
          const { data: rData } = await supabase
            .from("rsvps")
            .select("*")
            .eq("guest_id", session.guest_id);
          if (rData) {
            const map: Record<string, Rsvp> = {};
            for (const r of rData as Rsvp[]) {
              map[r.event_id] = r;
            }
            setRsvps(map);
          }
        }
      }
      setLoading(false);
    })();
  }, [slug, session?.guest_id]);

  const theme = getTheme(wedding);
  const content = (wedding?.draft_content || wedding?.content || {}) as Record<string, unknown>;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "rsvp");

  const handleRsvp = async (event: WeddingEvent, status: "attending" | "declined") => {
    if (!session?.guest_id || !wedding) return;
    setSubmitting(event.id);
    setError(null);

    const existing = rsvps[event.id];

    try {
      if (existing) {
        // Update existing RSVP
        const { data, error: uError } = await supabase
          .from("rsvps")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single();
        if (uError) throw uError;
        setRsvps({ ...rsvps, [event.id]: data as Rsvp });
      } else {
        // Create new RSVP
        const { data, error: iError } = await supabase
          .from("rsvps")
          .insert({
            wedding_id: wedding.id,
            guest_id: session.guest_id,
            event_id: event.id,
            status,
            number_of_guests: 1,
          })
          .select()
          .single();
        if (iError) throw iError;
        setRsvps({ ...rsvps, [event.id]: data as Rsvp });
      }
    } catch {
      setError(lang === "en" ? "Failed to submit RSVP. Please try again." : "Gagal menghantar RSVP. Sila cuba lagi.");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="animate-pulse text-sm tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
          {t.loading}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-6 py-12 md:py-16"
      style={{
        ...themeToCssVars(theme),
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      } as React.CSSProperties}
    >
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        {showLogo && logo.url && (
          <div className="flex justify-center mb-8 animate-fade-in">
            <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "var(--color-text-muted)" }}>
            {lang === "en" ? "Kindly Respond" : "Sila Maklum"}
          </p>
          <h1
            className="font-heading"
            style={{ color: "var(--color-primary)", fontSize: "2.5rem", fontWeight: 400, letterSpacing: "-0.01em" }}
          >
            {t.rsvp}
          </h1>
        </div>

        {/* Intro text */}
        {Boolean(content.rsvp_intro) ? (
          <p
            className="text-center text-sm leading-relaxed mb-10 max-w-md mx-auto animate-fade-in-up"
            style={{ color: "var(--color-text-muted)", animationDelay: "0.1s" }}
          >
            {String(content.rsvp_intro)}
          </p>
        ) : null}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Event Cards */}
        <div className="space-y-6">
          {events.length === 0 && (
            <p className="text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              {lang === "en" ? "No events available." : "Tiada acara tersedia."}
            </p>
          )}
          {events.map((event, i) => {
            const currentRsvp = rsvps[event.id];
            const isSubmitting = submitting === event.id;
            return (
              <div
                key={event.id}
                className="rounded-2xl border p-6 md:p-8 animate-fade-in-up transition-all"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface)",
                  animationDelay: `${0.15 * (i + 1)}s`,
                }}
              >
                {/* Event name */}
                <h3
                  className="font-heading text-xl md:text-2xl mb-2"
                  style={{ color: "var(--color-primary)", fontWeight: 400 }}
                >
                  {event.name}
                </h3>

                {/* Event kind badge */}
                {event.kind && (
                  <span
                    className="inline-block text-xs tracking-widest uppercase mb-4"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {event.kind}
                  </span>
                )}

                {/* Date & Time */}
                {event.starts_at && (
                  <div className="flex items-center gap-2 mb-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(event.starts_at, lang)} · {formatTime(event.starts_at)}</span>
                  </div>
                )}

                {/* Venue */}
                {event.venue_name && (
                  <div className="flex items-center gap-2 mb-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{event.venue_name}</span>
                  </div>
                )}

                {/* Venue address */}
                {event.venue_address && (
                  <p className="text-sm mb-3 pl-5" style={{ color: "var(--color-text-muted)" }}>
                    {event.venue_address}
                  </p>
                )}

                {/* Description */}
                {event.description && (
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--color-text)" }}>
                    {event.description}
                  </p>
                )}

                {/* Dress code */}
                {event.dress_code && (
                  <p className="text-xs mb-4 tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    {lang === "en" ? "Dress Code" : "Pakaian"}: {event.dress_code}
                  </p>
                )}

                {/* RSVP Status */}
                {currentRsvp && (
                  <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: "var(--color-primary)" }}>
                    <Check className="w-4 h-4" />
                    <span>
                      {currentRsvp.status === "attending"
                        ? t.attending
                        : currentRsvp.status === "declined"
                        ? t.declined
                        : t.pending}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleRsvp(event, "attending")}
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 rounded-lg py-3 text-sm font-medium transition-all disabled:opacity-50",
                      currentRsvp?.status === "attending" ? "ring-2" : ""
                    )}
                    style={{
                      background: currentRsvp?.status === "attending" ? "var(--color-button-bg)" : "transparent",
                      color: currentRsvp?.status === "attending" ? "var(--color-button-text)" : "var(--color-text)",
                      border: `1px solid ${currentRsvp?.status === "attending" ? "var(--color-button-bg)" : "var(--color-border)"}`,
                    }}
                  >
                    {t.attending}
                  </button>
                  <button
                    onClick={() => handleRsvp(event, "declined")}
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 rounded-lg py-3 text-sm font-medium transition-all disabled:opacity-50",
                      currentRsvp?.status === "declined" ? "ring-2" : ""
                    )}
                    style={{
                      background: currentRsvp?.status === "declined" ? "var(--color-text)" : "transparent",
                      color: currentRsvp?.status === "declined" ? "var(--color-bg)" : "var(--color-text)",
                      border: `1px solid ${currentRsvp?.status === "declined" ? "var(--color-text)" : "var(--color-border)"}`,
                    }}
                  >
                    {t.declined}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing text */}
        {content.rsvp_closing ? (
          <p
            className="text-center text-sm italic mt-12 animate-fade-in-up"
            style={{ color: "var(--color-text-muted)" }}
          >
            {String(content.rsvp_closing)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default Rsvp;

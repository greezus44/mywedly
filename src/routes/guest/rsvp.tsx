import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  supabase,
  type Wedding,
  type WeddingEvent,
  type WeddingContent,
  type Rsvp,
  type RsvpStatus,
} from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import {
  themeToCssVars,
  getTheme,
  getLogoConfig,
  getLogoStyle,
  shouldShowLogo,
} from "../../lib/theme";
import { formatDate, formatTime, getDeviceType } from "../../lib/utils";
import { Check, X, Calendar, MapPin, Clock } from "lucide-react";

export function Rsvp() {
  const { slug } = useParams<{ slug: string }>();
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, RsvpStatus>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submittedEvents, setSubmittedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setWedding(data as Wedding);
      });
  }, [slug]);

  useEffect(() => {
    if (!wedding) return;
    supabase
      .from("events")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setEvents(data as WeddingEvent[]);
        setLoading(false);
      });
  }, [wedding]);

  // Fetch existing RSVPs
  useEffect(() => {
    if (!wedding || !session) return;
    supabase
      .from("rsvps")
      .select("*")
      .eq("wedding_id", wedding.id)
      .eq("guest_id", session.guest_id)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, RsvpStatus> = {};
          (data as Rsvp[]).forEach((r) => {
            map[r.event_id] = r.status;
          });
          setRsvps(map);
        }
      });
  }, [wedding, session]);

  const theme = getTheme(wedding);
  const content = (wedding?.content || {}) as WeddingContent;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "rsvp") && logo.url;

  const handleRsvp = async (event: WeddingEvent, status: RsvpStatus) => {
    if (!wedding || !session) return;
    setSubmitting(event.id);

    // Check if RSVP already exists
    const { data: existing } = await supabase
      .from("rsvps")
      .select("id")
      .eq("wedding_id", wedding.id)
      .eq("guest_id", session.guest_id)
      .eq("event_id", event.id)
      .maybeSingle();

    if (existing) {
      // Update
      await supabase
        .from("rsvps")
        .update({
          status,
          number_of_guests: status === "attending" ? 1 : 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Insert
      await supabase.from("rsvps").insert({
        wedding_id: wedding.id,
        guest_id: session.guest_id,
        event_id: event.id,
        status,
        number_of_guests: status === "attending" ? 1 : 0,
        message: null,
      });
    }

    setRsvps((prev) => ({ ...prev, [event.id]: status }));
    setSubmittedEvents((prev) => new Set(prev).add(event.id));
    setSubmitting(null);
  };

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        style={{ ...themeToCssVars(theme), background: "var(--color-bg)" } as React.CSSProperties}
      >
        <p className="font-body text-sm text-gray-400">{t.loading}</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeToCssVars(theme),
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      } as React.CSSProperties}
    >
      {/* Header */}
      <section className="px-6 py-16 md:py-20">
        {/* Logo */}
        {showLogo && (
          <div className="mb-10 flex justify-center animate-fade-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <img src={logo.url!} alt="logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        <p
          className="mb-4 text-center font-body text-xs uppercase tracking-[0.3em] text-gray-400 animate-fade-in-up"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          {lang === "ms" ? "Tetapan Kehadiran" : "Attendance"}
        </p>
        <h1
          className="text-center font-heading text-3xl font-light md:text-5xl animate-fade-in-up"
          style={{ animationDelay: "0.3s", opacity: 0, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}
        >
          RSVP
        </h1>

        {/* RSVP intro — using Boolean(content.rsvp_intro) and String(content.rsvp_intro) */}
        {Boolean(content.rsvp_intro) && (
          <p
            className="mx-auto mt-6 max-w-lg text-center font-body text-sm leading-relaxed text-gray-500 md:text-base animate-fade-in-up"
            style={{ animationDelay: "0.4s", opacity: 0 }}
          >
            {String(content.rsvp_intro)}
          </p>
        )}
      </section>

      {/* Event cards */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-2xl space-y-6">
          {events.length === 0 && !loading && (
            <p className="text-center font-body text-sm text-gray-400">
              {lang === "ms" ? "Tiada acara dijumpati." : "No events found."}
            </p>
          )}
          {events.map((event, i) => {
            const currentStatus = rsvps[event.id];
            const isSubmitted = submittedEvents.has(event.id);
            return (
              <div
                key={event.id}
                className="animate-fade-in-up border border-gray-200 bg-white p-6 md:p-8"
                style={{
                  animationDelay: `${0.2 + i * 0.1}s`,
                  opacity: 0,
                  borderRadius: "0px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {/* Event kind badge */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-body text-[0.6rem] uppercase tracking-[0.2em] text-gray-400">
                    {event.kind}
                  </span>
                  {isSubmitted && (
                    <span className="font-body text-[0.6rem] uppercase tracking-[0.2em] text-gray-300">
                      {lang === "ms" ? "Dihantar" : "Submitted"}
                    </span>
                  )}
                </div>

                {/* Event name */}
                <h2 className="font-heading text-xl font-light text-gray-800 md:text-2xl">
                  {event.name}
                </h2>

                {/* Event details */}
                <div className="mt-4 space-y-2">
                  {event.starts_at && (
                    <div className="flex items-center gap-2 font-body text-sm text-gray-500">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>{formatDate(event.starts_at, lang)}</span>
                      <span className="text-gray-300">·</span>
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>{formatTime(event.starts_at)}</span>
                    </div>
                  )}
                  {event.venue_name && (
                    <div className="flex items-center gap-2 font-body text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span>{event.venue_name}</span>
                    </div>
                  )}
                  {event.venue_address && (
                    <p className="pl-5 font-body text-xs text-gray-400">{event.venue_address}</p>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <p className="mt-4 font-body text-sm leading-relaxed text-gray-500">
                    {event.description}
                  </p>
                )}

                {/* RSVP buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleRsvp(event, "attending")}
                    disabled={submitting === event.id}
                    className="flex flex-1 items-center justify-center gap-2 border px-4 py-3 font-body text-sm font-medium transition-all disabled:opacity-50"
                    style={{
                      background:
                        currentStatus === "attending" ? "var(--color-text)" : "transparent",
                      color:
                        currentStatus === "attending" ? "var(--color-bg)" : "var(--color-text)",
                      borderColor:
                        currentStatus === "attending" ? "var(--color-text)" : "var(--color-border)",
                    } as React.CSSProperties}
                  >
                    <Check className="h-4 w-4" />
                    {t.attending}
                  </button>
                  <button
                    onClick={() => handleRsvp(event, "declined")}
                    disabled={submitting === event.id}
                    className="flex flex-1 items-center justify-center gap-2 border px-4 py-3 font-body text-sm font-medium transition-all disabled:opacity-50"
                    style={{
                      background:
                        currentStatus === "declined" ? "var(--color-text)" : "transparent",
                      color:
                        currentStatus === "declined" ? "var(--color-bg)" : "var(--color-text-muted)",
                      borderColor:
                        currentStatus === "declined" ? "var(--color-text)" : "var(--color-border)",
                    } as React.CSSProperties}
                  >
                    <X className="h-4 w-4" />
                    {t.declined}
                  </button>
                </div>

                {/* Status confirmation */}
                {isSubmitted && currentStatus && (
                  <p className="mt-3 text-center font-body text-xs text-gray-400">
                    {t.rsvpSubmitted}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* RSVP closing */}
        {content.rsvp_closing && (
          <p className="mx-auto mt-10 max-w-lg text-center font-script text-lg text-gray-400">
            {content.rsvp_closing}
          </p>
        )}
      </section>
    </div>
  );
}

export default Rsvp;

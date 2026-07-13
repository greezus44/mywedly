import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, X, Clock, Calendar, MapPin } from "lucide-react";
import { supabase, type WeddingEvent, type Rsvp, type RsvpStatus } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, coverToCssVars, getTheme, getCoverConfig, getLogoConfig, getLogoStyle } from "../../lib/theme";
import { formatDate, formatTime, getDeviceType, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

export function Rsvp() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, Rsvp>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!session) return;
    const { data: eventRows } = await supabase.from("events").select("*").eq("wedding_id", session.wedding.id).order("sort_order", { ascending: true });
    setEvents((eventRows || []) as WeddingEvent[]);
    const { data: rsvpRows } = await supabase.from("rsvps").select("*").eq("guest_id", session.guest.id);
    const map: Record<string, Rsvp> = {};
    (rsvpRows || []).forEach((r) => {
      const rr = r as Rsvp;
      if (rr.event_id) map[rr.event_id] = rr;
    });
    setRsvps(map);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (!session) { navigate(`/w/${slug}/login`, { replace: true }); return; }
    loadEvents();
  }, [session, slug, navigate, loadEvents]);

  const handleRsvp = async (event: WeddingEvent, status: RsvpStatus) => {
    if (!session) return;
    setSubmitting(event.id);
    const existing = rsvps[event.id];
    if (existing) {
      const { data } = await supabase.from("rsvps").update({ status, updated_at: new Date().toISOString() }).eq("id", existing.id).select("*").single();
      if (data) setRsvps((prev) => ({ ...prev, [event.id]: data as Rsvp }));
    } else {
      const { data } = await supabase.from("rsvps").insert({
        wedding_id: session.wedding.id,
        guest_id: session.guest.id,
        guest_name: session.guest.full_name,
        guest_email: session.guest.email,
        event_id: event.id,
        status,
      }).select("*").single();
      if (data) setRsvps((prev) => ({ ...prev, [event.id]: data as Rsvp }));
    }
    setSubmitting(null);
  };

  if (!session) return null;

  const wedding = session.wedding;
  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const content = (wedding.content || {}) as Record<string, unknown>;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();

  const showLogo = logo.visible && logo.url && (logo.showOnPages === "all-pages" || (logo.showOnPages === "custom" && logo.customPages.includes("rsvp")));

  return (
    <div
      className="min-h-screen px-6 py-12 md:py-20"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as React.CSSProperties}
    >
      <div className="max-w-2xl mx-auto">
        {showLogo && (
          <div className="flex justify-center mb-8 animate-fade-in">
            <img src={logo.url!} alt="Logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="font-script text-4xl text-[var(--color-primary)] mb-3">{t("rsvp")}</h1>
          {Boolean(content.rsvp_intro) && (
            <p className="font-body text-lg text-[var(--color-text-muted)]">{String(content.rsvp_intro)}</p>
          )}
        </div>

        {loading ? (
          <div className="text-center font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted)] animate-pulse">
            {t("loading")}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center font-body text-lg text-[var(--color-text-muted)] py-12">
            {t("noEvents")}
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event, idx) => {
              const rsvp = rsvps[event.id];
              const currentStatus = rsvp?.status || "pending";
              return (
                <div
                  key={event.id}
                  className={cn(
                    "bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg p-6 animate-fade-in-up opacity-0-init",
                    ["delay-100", "delay-200", "delay-300", "delay-400", "delay-500"][idx % 5]
                  )}
                >
                  <div className="mb-4">
                    <h3 className="font-script text-2xl text-[var(--color-primary)] mb-2">{event.name}</h3>
                    {event.kind && (
                      <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-3">
                        {event.kind}
                      </p>
                    )}
                    {event.starts_at && (
                      <div className="flex items-center gap-2 font-ui text-sm text-[var(--color-text)] mb-1">
                        <Calendar size={14} className="text-[var(--color-primary)]" />
                        <span>{formatDate(event.starts_at, lang)} · {formatTime(event.starts_at, lang)}</span>
                      </div>
                    )}
                    {event.venue_name && (
                      <div className="flex items-center gap-2 font-ui text-sm text-[var(--color-text-muted)]">
                        <MapPin size={14} className="text-[var(--color-primary)]" />
                        <span>{event.venue_name}</span>
                      </div>
                    )}
                    {event.description && (
                      <p className="font-body text-base text-[var(--color-text-muted)] mt-3">{event.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button
                      variant={currentStatus === "accepted" ? "primary" : "outline"}
                      size="sm"
                      disabled={submitting === event.id}
                      onClick={() => handleRsvp(event, "accepted")}
                      className={cn(currentStatus === "accepted" && "cursor-default")}
                    >
                      <Check size={14} className="mr-1.5" />
                      {t("accept")}
                    </Button>
                    <Button
                      variant={currentStatus === "declined" ? "danger" : "outline"}
                      size="sm"
                      disabled={submitting === event.id}
                      onClick={() => handleRsvp(event, "declined")}
                    >
                      <X size={14} className="mr-1.5" />
                      {t("decline")}
                    </Button>
                    {currentStatus !== "pending" && (
                      <span className="inline-flex items-center gap-1.5 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] px-2">
                        <Clock size={12} />
                        {t(currentStatus as "accepted" | "declined")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {Boolean(content.rsvp_closing) && !loading && events.length > 0 && (
          <p className="font-body text-base text-[var(--color-text-muted)] italic text-center mt-10 animate-fade-in opacity-0-init delay-500">
            {String(content.rsvp_closing ?? "")}
          </p>
        )}
      </div>
    </div>
  );
}

export default Rsvp;

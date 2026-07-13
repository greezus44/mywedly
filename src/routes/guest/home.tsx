import { Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { supabase, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { useGuestOutletContext } from "./guest-layout";

/**
 * GuestHome — the main guest landing page after login.
 * Shows event details, story, invitation, sub-events with RSVP links, and a schedule preview.
 * Uses event CSS vars for all colors.
 */
export default function GuestHome() {
  const { event } = useGuestOutletContext();
  const content = event.content || {};
  const headingFont: React.CSSProperties = { fontFamily: "var(--event-font-heading)" };

  const { data: subEvents = [] } = useQuery({
    queryKey: ["guest-sub-events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data as SubEvent[]) || [];
    },
  });

  const { data: schedule = [] } = useQuery({
    queryKey: ["guest-schedule", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data as ScheduleItem[]) || [];
    },
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
      {/* Hero / invitation */}
      <section className="px-6 py-20 text-center" style={{ backgroundColor: "var(--event-surface)" }}>
        <div className="max-w-2xl mx-auto">
          {content.invitation_subtitle && (
            <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: "var(--event-text-muted)" }}>
              {content.invitation_subtitle}
            </p>
          )}
          <h1 className="text-5xl md:text-6xl mb-4" style={headingFont}>
            {content.invitation_title || event.name}
          </h1>
          {content.invitation_body && (
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--event-text-muted)" }}>
              {content.invitation_body}
            </p>
          )}
          {event.event_date && (
            <div className="flex flex-col items-center gap-2 mb-8">
              <p className="text-lg font-script" style={{ color: "var(--event-text)" }}>{formatDate(event.event_date)}</p>
              {event.event_time && (
                <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--event-text-muted)" }}>
                  <Clock className="w-4 h-4" /> {formatTime(event.event_time)}
                </p>
              )}
              {event.venue && (
                <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--event-text-muted)" }}>
                  <MapPin className="w-4 h-4" /> {event.venue}
                </p>
              )}
            </div>
          )}
          <Link to="rsvp">
            <Button
              style={{ backgroundColor: "var(--event-primary)", color: "#fff", borderRadius: "var(--event-radius)" }}
            >
              {content.rsvp_button_text || "RSVP Now"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Story */}
      {content.story && (
        <section className="px-6 py-20 max-w-2xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.3em] mb-6" style={{ color: "var(--event-text-muted)" }}>Our Story</p>
          {content.story_image && (
            <img src={content.story_image} alt="Our story" className="w-full max-w-md mx-auto mb-8 rounded-lg" style={{ borderRadius: "var(--event-radius)" }} />
          )}
          <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: "var(--event-text)" }}>
            {content.story}
          </p>
        </section>
      )}

      {/* Sub-events */}
      {subEvents.length > 0 && (
        <section className="px-6 py-20" style={{ backgroundColor: "var(--event-surface)" }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl text-center mb-12" style={headingFont}>Events</h2>
            <div className="space-y-6">
              {subEvents.map((se) => (
                <div
                  key={se.id}
                  className="p-6 border"
                  style={{ borderColor: "var(--event-border)", borderRadius: "var(--event-radius)", backgroundColor: "var(--event-bg)" }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-xl mb-2" style={headingFont}>{se.name}</h3>
                      {se.date && (
                        <p className="text-sm flex items-center gap-1.5 mb-1" style={{ color: "var(--event-text-muted)" }}>
                          <Calendar className="w-4 h-4" /> {formatDate(se.date)}
                          {se.time ? ` · ${formatTime(se.time)}` : ""}
                        </p>
                      )}
                      {se.venue && (
                        <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--event-text-muted)" }}>
                          <MapPin className="w-4 h-4" /> {se.venue}
                        </p>
                      )}
                      {se.description && (
                        <p className="text-sm mt-3" style={{ color: "var(--event-text-muted)" }}>{se.description}</p>
                      )}
                    </div>
                    <Link to={`rsvp?sub=${se.id}`}>
                      <Button variant="secondary" size="sm" style={{ borderColor: "var(--event-border)", borderRadius: "var(--event-radius)" }}>
                        RSVP
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Schedule preview */}
      {schedule.length > 0 && (
        <section className="px-6 py-20 max-w-2xl mx-auto">
          <h2 className="text-3xl text-center mb-12" style={headingFont}>Schedule</h2>
          <div className="space-y-4">
            {schedule.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-start gap-4 pb-4 border-b" style={{ borderColor: "var(--event-border)" }}>
                <div className="w-16 text-right shrink-0">
                  {item.start_time && (
                    <p className="text-sm font-medium" style={{ color: "var(--event-primary)" }}>{formatTime(item.start_time)}</p>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-base" style={headingFont}>{item.title}</h4>
                  {item.description && (
                    <p className="text-sm mt-1" style={{ color: "var(--event-text-muted)" }}>{item.description}</p>
                  )}
                  {item.venue && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--event-text-muted)" }}>
                      <MapPin className="w-3 h-3" /> {item.venue}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer nav */}
      <nav className="px-6 py-10 flex items-center justify-center gap-6 text-sm" style={{ borderTop: "1px solid var(--event-border)", color: "var(--event-text-muted)" }}>
        <Link to="rsvp" className="hover:underline">RSVP</Link>
        <Link to="wishes" className="hover:underline">Wishes</Link>
        <Link to="contact" className="hover:underline">Contact</Link>
      </nav>
    </div>
  );
}

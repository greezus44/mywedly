import { Link, useNavigate } from "react-router-dom";
import { useGuestContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatTime, getEventStatus, isRsvpClosed } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Calendar, Clock, MapPin, ArrowRight, CalendarCheck, MessageCircle, Info, ChevronRight, Heart } from "lucide-react";

export default function GuestHome() {
  const { event, subEvents, schedule } = useGuestContext();
  const { guestName, isAuthenticated, signOut } = useGuestAuth();
  const navigate = useNavigate();
  const content = event.content || {};

  // Check if guest has already submitted an RSVP
  const { data: existingRsvps = [] } = useQuery({
    queryKey: ["guest-rsvps", event.id, guestName],
    queryFn: async () => {
      if (!guestName) return [];
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_name", guestName);
      if (error) throw error;
      return (data as EventRsvp[]) || [];
    },
    enabled: !!guestName,
  });

  const hasRsvp = existingRsvps.length > 0;
  const status = getEventStatus(event.event_date);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-[var(--color-text-muted)] mb-6">Please sign in to view this page.</p>
        <Button onClick={() => navigate("./login")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero / Header */}
      <header className="border-b border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-4">
            {content.invitation_title || "You're Invited"}
          </p>
          <h1 className="font-[var(--font-heading)] text-4xl md:text-5xl tracking-tight mb-4">{event.name}</h1>
          {content.invitation_subtitle && (
            <p className="font-[var(--font-script)] text-lg italic text-[var(--color-text-muted)] mb-6">{content.invitation_subtitle}</p>
          )}
          {event.event_date && (
            <div className="flex items-center justify-center gap-3 text-sm text-[var(--color-text-muted)]">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.event_date)}</span>
              {event.event_time && (<><span>·</span><Clock className="w-4 h-4" /><span>{formatTime(event.event_time)}</span></>)}
            </div>
          )}
          {event.venue && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-[var(--color-text-muted)]">
              <MapPin className="w-4 h-4" />
              <span>{event.venue}</span>
            </div>
          )}
        </div>
      </header>

      {/* Guest greeting + sign out */}
      <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">Welcome, <span className="font-medium text-[var(--color-text)]">{guestName}</span></p>
        <button onClick={signOut} className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          Sign Out
        </button>
      </div>

      {/* Invitation body */}
      {(content.invitation_body || content.invitation_text) && (
        <section className="max-w-2xl mx-auto px-6 py-12 text-center">
          <p className="text-base leading-relaxed text-[var(--color-text)] whitespace-pre-wrap">
            {content.invitation_body || content.invitation_text}
          </p>
        </section>
      )}

      {/* Story */}
      {content.story && (
        <section className="max-w-2xl mx-auto px-6 py-12 border-t border-[var(--color-border)]">
          <div className="text-center mb-8">
            <Heart className="w-6 h-6 mx-auto text-[var(--color-accent)] mb-3" />
            <h2 className="font-[var(--font-heading)] text-2xl">Our Story</h2>
          </div>
          {content.story_image && (
            <img src={content.story_image} alt="Our story" className="w-full max-h-80 object-cover mb-6" style={{ borderRadius: "var(--radius)" }} />
          )}
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)] whitespace-pre-wrap">{content.story}</p>
        </section>
      )}

      {/* Sub-events */}
      {subEvents.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 py-12 border-t border-[var(--color-border)]">
          <div className="text-center mb-8">
            <CalendarCheck className="w-6 h-6 mx-auto text-[var(--color-accent)] mb-3" />
            <h2 className="font-[var(--font-heading)] text-2xl">Events</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{subEvents.length} {subEvents.length === 1 ? "event" : "events"} to celebrate</p>
          </div>
          <div className="space-y-4">
            {subEvents.map((se) => {
              const closed = isRsvpClosed(se.rsvp_deadline);
              return (
                <div key={se.id} className="border border-[var(--color-border)] p-5" style={{ borderRadius: "var(--radius)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-[var(--font-heading)] text-lg mb-1">{se.name}</h3>
                      {se.date && <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5"><Calendar className="w-3 h-3" />{formatDate(se.date)}</p>}
                      {se.time && <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 mt-1"><Clock className="w-3 h-3" />{formatTime(se.time)}</p>}
                      {se.venue && <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 mt-1"><MapPin className="w-3 h-3" />{se.venue}</p>}
                      {se.description && <p className="text-sm text-[var(--color-text-muted)] mt-3">{se.description}</p>}
                      {se.dress_code && <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mt-2">Dress: {se.dress_code}</p>}
                    </div>
                  </div>
                  {se.rsvp_enabled && (
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                      {closed ? (
                        <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">RSVP Closed</p>
                      ) : (
                        <Link to="./rsvp" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[var(--color-accent)] hover:opacity-70">
                          RSVP for this event <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Schedule preview */}
      {schedule.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 py-12 border-t border-[var(--color-border)]">
          <div className="text-center mb-8">
            <Clock className="w-6 h-6 mx-auto text-[var(--color-accent)] mb-3" />
            <h2 className="font-[var(--font-heading)] text-2xl">Schedule</h2>
          </div>
          <div className="space-y-3">
            {schedule.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-start gap-4 py-3 border-b border-[var(--color-border)] last:border-0">
                <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] min-w-[80px]">
                  {item.start_time ? formatTime(item.start_time) : formatDate(item.schedule_date)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{item.title}</h4>
                  {item.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.description}</p>}
                  {item.venue && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{item.venue}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="max-w-2xl mx-auto px-6 py-12 border-t border-[var(--color-border)]">
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="./rsvp" className="block">
            <div className="border border-[var(--color-border)] p-6 text-center hover:bg-[var(--color-bg-subtle)] transition-colors h-full" style={{ borderRadius: "var(--radius)" }}>
              <CalendarCheck className="w-5 h-5 mx-auto mb-3 text-[var(--color-accent)]" />
              <p className="text-sm font-medium">{hasRsvp ? "Edit RSVP" : (content.rsvp_button_text || "RSVP")}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{hasRsvp ? "Update your response" : "Let us know"}</p>
            </div>
          </Link>
          <Link to="./wishes" className="block">
            <div className="border border-[var(--color-border)] p-6 text-center hover:bg-[var(--color-bg-subtle)] transition-colors h-full" style={{ borderRadius: "var(--radius)" }}>
              <MessageCircle className="w-5 h-5 mx-auto mb-3 text-[var(--color-accent)]" />
              <p className="text-sm font-medium">Wishes</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Leave a message</p>
            </div>
          </Link>
          <Link to="./contact" className="block">
            <div className="border border-[var(--color-border)] p-6 text-center hover:bg-[var(--color-bg-subtle)] transition-colors h-full" style={{ borderRadius: "var(--radius)" }}>
              <Info className="w-5 h-5 mx-auto mb-3 text-[var(--color-accent)]" />
              <p className="text-sm font-medium">Details</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Venue & info</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{event.name}</p>
        {status === "completed" && <p className="text-xs text-[var(--color-text-muted)] mt-1">Thank you for celebrating with us</p>}
      </footer>
    </div>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useRustyContext } from "./rusty-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventRsvp, type UserEvent } from "../../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { RUSTY_CONTENT, RUSTY_THEME } from "../../lib/theme";
import { formatDate, formatTime, isRsvpClosed } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Calendar, Clock, MapPin, CalendarCheck, MessageCircle, Info, ChevronRight, Heart } from "lucide-react";

export type Lang = "en" | "id";

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-8">
      <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
      <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
      <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
    </div>
  );
}

export default function RustyHome() {
  const { event, subEvents, schedule } = useRustyContext();
  const { guestName, isAuthenticated, signOut } = useGuestAuth();
  const navigate = useNavigate();
  const content = { ...RUSTY_CONTENT, ...(event.content || {}) };

  const { data: existingRsvps = [] } = useQuery({
    queryKey: ["rusty-rsvps", event.id, guestName],
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm mb-6" style={{ color: RUSTY_THEME.textMutedColor! }}>Please sign in to view this page.</p>
        <Button onClick={() => navigate("./login")} style={{ backgroundColor: RUSTY_THEME.accentColor!, color: "#F5ECD7", borderRadius: "2px" }}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: RUSTY_THEME.bgColor!, color: RUSTY_THEME.textColor! }}>
      {/* Hero */}
      <header className="pt-20 pb-12 text-center px-6">
        <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: RUSTY_THEME.accentColor! }}>
          {content.invitation_title}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4" style={{ fontFamily: RUSTY_THEME.headingFont }}>
          {event.name}
        </h1>
        {content.invitation_subtitle && (
          <p className="font-serif text-lg italic mb-6" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>
            {content.invitation_subtitle}
          </p>
        )}
        {event.event_date && (
          <div className="flex items-center justify-center gap-3 text-sm" style={{ color: RUSTY_THEME.textMutedColor! }}>
            <Calendar className="w-4 h-4" style={{ color: RUSTY_THEME.accentColor! }} />
            <span>{formatDate(event.event_date)}</span>
            {event.event_time && (<><span>·</span><Clock className="w-4 h-4" style={{ color: RUSTY_THEME.accentColor! }} /><span>{formatTime(event.event_time)}</span></>)}
          </div>
        )}
        {event.venue && (
          <div className="flex items-center justify-center gap-2 mt-2 text-sm" style={{ color: RUSTY_THEME.textMutedColor! }}>
            <MapPin className="w-4 h-4" style={{ color: RUSTY_THEME.accentColor! }} />
            <span>{event.venue}</span>
          </div>
        )}
      </header>

      {/* Guest greeting */}
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <p className="text-sm" style={{ color: RUSTY_THEME.textMutedColor! }}>
          Welcome, <span className="font-medium" style={{ color: RUSTY_THEME.textColor! }}>{guestName}</span>
        </p>
        <button onClick={signOut} className="text-xs uppercase tracking-wider transition-opacity hover:opacity-70" style={{ color: RUSTY_THEME.textMutedColor! }}>
          Sign Out
        </button>
      </div>

      {/* Invitation body */}
      {content.invitation_body && (
        <section className="max-w-xl mx-auto px-6 py-8 text-center">
          <GoldDivider />
          <p className="text-base leading-relaxed font-serif italic whitespace-pre-wrap" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textColor! }}>
            {content.invitation_body}
          </p>
        </section>
      )}

      {/* Story */}
      {content.story && (
        <section className="max-w-xl mx-auto px-6 py-8">
          <GoldDivider />
          <div className="text-center mb-6">
            <Heart className="w-5 h-5 mx-auto mb-3" style={{ color: RUSTY_THEME.accentColor! }} />
            <h2 className="font-serif text-2xl" style={{ fontFamily: RUSTY_THEME.headingFont }}>Our Story</h2>
          </div>
          {content.story_image && (
            <img src={content.story_image} alt="Our story" className="w-full max-h-80 object-cover mb-6" style={{ borderRadius: "2px", border: `1px solid ${RUSTY_THEME.borderColor}` }} />
          )}
          <p className="text-sm leading-relaxed font-serif italic whitespace-pre-wrap text-center" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>
            {content.story}
          </p>
        </section>
      )}

      {/* Sub-events */}
      {subEvents.length > 0 && (
        <section className="max-w-xl mx-auto px-6 py-8">
          <GoldDivider />
          <div className="text-center mb-8">
            <CalendarCheck className="w-5 h-5 mx-auto mb-3" style={{ color: RUSTY_THEME.accentColor! }} />
            <h2 className="font-serif text-2xl" style={{ fontFamily: RUSTY_THEME.headingFont }}>Events</h2>
            <p className="text-sm mt-1" style={{ color: RUSTY_THEME.textMutedColor! }}>{subEvents.length} {subEvents.length === 1 ? "event" : "events"} to celebrate</p>
          </div>
          <div className="space-y-4">
            {subEvents.map((se) => {
              const closed = isRsvpClosed(se.rsvp_deadline);
              return (
                <div key={se.id} className="p-5" style={{ border: `1px solid ${RUSTY_THEME.borderColor}`, borderRadius: "2px", backgroundColor: RUSTY_THEME.bgSubtleColor }}>
                  <h3 className="font-serif text-lg mb-2" style={{ fontFamily: RUSTY_THEME.headingFont }}>{se.name}</h3>
                  {se.date && <p className="text-xs flex items-center gap-1.5" style={{ color: RUSTY_THEME.textMutedColor! }}><Calendar className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} />{formatDate(se.date)}</p>}
                  {se.time && <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: RUSTY_THEME.textMutedColor! }}><Clock className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} />{formatTime(se.time)}</p>}
                  {se.venue && <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: RUSTY_THEME.textMutedColor! }}><MapPin className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} />{se.venue}</p>}
                  {se.description && <p className="text-sm mt-3 font-serif italic" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>{se.description}</p>}
                  {se.dress_code && <p className="text-xs uppercase tracking-wider mt-2" style={{ color: RUSTY_THEME.accentColor! }}>Dress: {se.dress_code}</p>}
                  {se.rsvp_enabled && (
                    <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${RUSTY_THEME.borderColor}` }}>
                      {closed ? (
                        <p className="text-xs uppercase tracking-wider" style={{ color: RUSTY_THEME.textMutedColor! }}>RSVP Closed</p>
                      ) : (
                        <Link to="./rsvp" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider transition-opacity hover:opacity-70" style={{ color: RUSTY_THEME.accentColor! }}>
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
        <section className="max-w-xl mx-auto px-6 py-8">
          <GoldDivider />
          <div className="text-center mb-8">
            <Clock className="w-5 h-5 mx-auto mb-3" style={{ color: RUSTY_THEME.accentColor! }} />
            <h2 className="font-serif text-2xl" style={{ fontFamily: RUSTY_THEME.headingFont }}>Schedule</h2>
          </div>
          <div className="space-y-3">
            {schedule.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-start gap-4 py-3" style={{ borderBottom: `1px solid ${RUSTY_THEME.borderColor}` }}>
                <div className="text-xs uppercase tracking-wider min-w-[80px]" style={{ color: RUSTY_THEME.accentColor! }}>
                  {item.start_time ? formatTime(item.start_time) : formatDate(item.schedule_date)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium font-serif" style={{ fontFamily: RUSTY_THEME.headingFont }}>{item.title}</h4>
                  {item.description && <p className="text-xs mt-0.5 font-serif italic" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>{item.description}</p>}
                  {item.venue && <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: RUSTY_THEME.textMutedColor! }}><MapPin className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} />{item.venue}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="max-w-xl mx-auto px-6 py-8">
        <GoldDivider />
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="./rsvp" className="block">
            <div className="p-6 text-center transition-opacity hover:opacity-80" style={{ border: `1px solid ${RUSTY_THEME.accentColor}`, borderRadius: "2px", backgroundColor: RUSTY_THEME.bgSubtleColor }}>
              <CalendarCheck className="w-5 h-5 mx-auto mb-3" style={{ color: RUSTY_THEME.accentColor! }} />
              <p className="text-sm font-medium font-serif" style={{ fontFamily: RUSTY_THEME.headingFont }}>{hasRsvp ? "Edit RSVP" : (content.rsvp_button_text || "RSVP")}</p>
              <p className="text-xs mt-1" style={{ color: RUSTY_THEME.textMutedColor! }}>{hasRsvp ? "Update your response" : "Let us know"}</p>
            </div>
          </Link>
          <Link to="./wishes" className="block">
            <div className="p-6 text-center transition-opacity hover:opacity-80" style={{ border: `1px solid ${RUSTY_THEME.borderColor}`, borderRadius: "2px", backgroundColor: RUSTY_THEME.bgSubtleColor }}>
              <MessageCircle className="w-5 h-5 mx-auto mb-3" style={{ color: RUSTY_THEME.accentColor! }} />
              <p className="text-sm font-medium font-serif" style={{ fontFamily: RUSTY_THEME.headingFont }}>Wishes</p>
              <p className="text-xs mt-1" style={{ color: RUSTY_THEME.textMutedColor! }}>Leave a message</p>
            </div>
          </Link>
          <Link to="./contact" className="block">
            <div className="p-6 text-center transition-opacity hover:opacity-80" style={{ border: `1px solid ${RUSTY_THEME.borderColor}`, borderRadius: "2px", backgroundColor: RUSTY_THEME.bgSubtleColor }}>
              <Info className="w-5 h-5 mx-auto mb-3" style={{ color: RUSTY_THEME.accentColor! }} />
              <p className="text-sm font-medium font-serif" style={{ fontFamily: RUSTY_THEME.headingFont }}>Details</p>
              <p className="text-xs mt-1" style={{ color: RUSTY_THEME.textMutedColor! }}>Venue & info</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center">
        <GoldDivider />
        <p className="text-xs uppercase tracking-wider font-serif" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.accentColor! }}>{event.name}</p>
      </footer>
    </div>
  );
}
